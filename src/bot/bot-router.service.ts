import { Telegraf } from 'telegraf';
import { UserService } from '../features/user/services/user.service.ts';
import { message } from 'telegraf/filters';
import { MedicationService } from '../features/medication/services/medication.service.ts';
import type { ConversationStateService } from '../shared/conversation-state/conversation-state.service.ts';
import {
  type ConversationData,
  ConversationState,
} from '../shared/conversation-state/conversation-state-store.interface.ts';
import type { TextMessageContext } from './types/context.type.ts';
import type { MedicationValidator } from '../features/medication/validators/medication.validator.ts';
import type { NotificationService } from '../features/notification/services/notification.service.ts';
import type { BotService } from './bot.service.ts';
import logger from '../shared/logger/logger.ts';

export class BotRouterService {
  private readonly commands = [
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Show help message' },
    { command: 'add_medication', description: 'Add a new medication' },
    { command: 'cancel_add_medication', description: 'Cancel adding a new medication' },
    { command: 'contact_developer', description: 'Contact the developer' },
  ];

  private readonly HELP_DESCRIPTION =
    'Available commands:\n' +
    `${this.commands.map(c => `/${c.command} - ${c.description}`).join('\n')}`;
  private readonly UNKNOWN_COMMAND = `Unknown command. ${this.HELP_DESCRIPTION}`;
  private readonly BOT_IS_STARTED = `You have already started bot. ${this.HELP_DESCRIPTION}`;

  constructor(
    private readonly botService: BotService,
    private readonly userService: UserService,
    private readonly conversationStateService: ConversationStateService,
    private readonly medicationService: MedicationService,
    private readonly medicationValidator: MedicationValidator,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Sets up command handlers for the bot
   * @param bot The Telegraf bot instance
   */
  async setupCommands(bot: Telegraf): Promise<void> {
    logger.info('Bot setup commands', { commands: this.commands });
    await bot.telegram.setMyCommands(this.commands);
    await this.setupNotificationHandlers(bot);

    bot.start(async ctx => {
      const { telegramId } = this.botService.getTelegramUserInfo(ctx);
      const user = await this.userService.findUserByTelegramId(telegramId);

      if (user !== null) {
        return ctx.reply(this.BOT_IS_STARTED);
      }

      return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
    });

    bot.help(ctx => {
      return ctx.reply(this.HELP_DESCRIPTION);
    });

    bot.command('add_medication', async ctx => {
      const userInfo = this.botService.getTelegramUserInfo(ctx);

      try {
        const user = await this.userService.createOrGetUser(userInfo);
        logger.debug(`User created or found.`, { id: user.id });

        await this.conversationStateService.setConversationState(userInfo.chatId, {
          state: ConversationState.WAITING_FOR_MEDICATION_NAME,
        });

        return ctx.reply('Please enter the name of the medication:');
      } catch (e) {
        if (e instanceof Error) {
          logger.error(`Failed to create or get user.`, {
            userInfo,
            error: e.message,
            stack: e.stack,
          });
        } else {
          logger.error(`Failed to create or get user.`, {
            userInfo,
            error: String(e),
          });
        }

        return ctx.reply('Sorry, I could not identify you. Please try again later.');
      }
    });

    bot.command('cancel_add_medication', async ctx => {
      const chatId = ctx.chat.id;
      const conversationState = await this.conversationStateService.getConversationState(chatId);

      if (conversationState) {
        await this.conversationStateService.clearConversationState(chatId);
        return ctx.reply('Medication addition cancelled. You can start again with /add_medication');
      }

      return ctx.reply('No active conversation to cancel.');
    });
    // Write to developer command
    bot.command('contact_developer', ctx => {
      return ctx.reply(
        'If you have any questions or suggestions, please write them here and they will be forwarded to the developer.'
      );
    });

    bot.on(message('text'), async ctx => {
      const chatId = ctx.chat.id;
      const conversation = await this.conversationStateService.getConversationState(chatId);

      if (conversation === undefined) {
        return ctx.reply(this.UNKNOWN_COMMAND);
      }

      try {
        switch (conversation.state) {
          case ConversationState.WAITING_FOR_MEDICATION_NAME:
            return this.handleMedicationName(ctx, chatId, conversation);
          case ConversationState.WAITING_FOR_EXPIRATION_DATE:
            return await this.handleExpirationDate(ctx, chatId, conversation);
          case ConversationState.WAITING_FOR_NOTES:
            await this.handleNotes(ctx.message.text, chatId, conversation);
            return this.handleMedicationSave(ctx, chatId);
          default:
            await this.conversationStateService.clearConversationState(chatId);
            logger.error('Unknown conversation state', { conversation, chatId });
            return ctx.reply('Sorry, something went wrong. Please try again.');
        }
      } catch (e) {
        if (e instanceof Error) {
          logger.error(`Failed to handle conversation.`, {
            conversation,
            chatId,
            error: e.message,
            stack: e.stack,
          });
        } else {
          logger.error(`Failed to handle conversation ${conversation} for chatId=${chatId}.`, {
            error: String(e),
          });
        }
      }
    });
  }

  // TODO
  private async setupNotificationHandlers(bot: Telegraf): Promise<void> {
    bot.action(/skip_(\d+)/, async ctx => {
      if (!ctx.match) {
        throw new Error('Something went wrong. Please try again later.');
      }

      const medicationId = parseInt(ctx.match[1]);
      const result = await this.notificationService.handleSkipNotification(medicationId);

      if (result.success && result.medication) {
        await ctx.editMessageText(
          `⏭️ **Notification Postponed**\n\n` +
            `💊 ${result.medication.name}\n` +
            // `🔔 Next reminder: ${result.nextNotificationDate.toLocaleDateString()}\n\n` +
            `✅ *You'll receive another notification in 1 month.*`,
          { parse_mode: 'Markdown' }
        );
        await ctx.answerCbQuery('Notification postponed for 1 month');
      } else {
        await ctx.answerCbQuery('Error processing your request');
      }
    });

    bot.action(/accept_(\d+)/, async ctx => {
      if (!ctx.match) {
        throw new Error('Something went wrong. Please try again later.');
      }

      const medicationId = parseInt(ctx.match[1]);
      const result = await this.notificationService.handleAcceptNotification(medicationId);

      if (result.success && result.medication) {
        await ctx.editMessageText(
          `✅ **Medication Removed**\n\n` +
            `💊 ${result.medication.name}\n` +
            `🗑️ *Medication has been removed from your list.*\n\n` +
            `*No more notifications will be sent for this medication.*`,
          { parse_mode: 'Markdown' }
        );
        await ctx.answerCbQuery('Medication removed successfully');
      } else {
        await ctx.answerCbQuery('Error processing your request');
      }
    });
  }

  private async handleMedicationSave(ctx: TextMessageContext, chatId: number) {
    const conversation = await this.conversationStateService.getConversationState(chatId);
    if (conversation === undefined) {
      return ctx.reply(this.UNKNOWN_COMMAND);
    }

    const notes = ctx.message.text;
    const validationResult = this.medicationValidator.validateMedicationData(
      conversation.medicationName,
      conversation.expirationDate,
      notes
    );

    if (!validationResult.isValid) {
      logger.error(`${validationResult.error} (chatId: ${chatId})`, {
        error: validationResult.error,
      });
      return ctx.reply(`validationResult.error\nPlease try again.`);
    }

    try {
      const { telegramId } = this.botService.getTelegramUserInfo(ctx);
      const user = await this.userService.findUserByTelegramId(telegramId);
      if (user === null) {
        console.error(`Could not find user by telegram id: ${telegramId}`);
        return ctx.reply('Sorry, something went wrong. Please try again.');
      }

      const { medicationData } = validationResult;
      const medication = await this.medicationService.createMedication(user.id, medicationData);

      await this.notificationService.createNotification(
        medication.id,
        medicationData.expirationDate,
        chatId
      );

      return ctx.reply(`Medication "${medication.name}" has been added successfully!`); // todo add text: next remind will be
    } catch (error) {
      logger.error('Error saving medication:', { error });
      return ctx.reply('Sorry, there was an error saving your medication. Please try again.');
    } finally {
      await this.conversationStateService.clearConversationState(chatId);
    }
  }

  private async handleNotes(notes: string, chatId: number, conversation: ConversationData) {
    await this.conversationStateService.setConversationState(chatId, {
      ...conversation,
      state: ConversationState.IDLE,
      notes,
    });
  }

  private async handleExpirationDate(
    ctx: TextMessageContext,
    chatId: number,
    conversation: ConversationData
  ) {
    const validationResult = this.medicationValidator.validateExpirationDate(ctx.message.text);

    if (!validationResult.isValid) {
      return ctx.reply(validationResult.error);
    }

    await this.conversationStateService.setConversationState(chatId, {
      ...conversation,
      state: ConversationState.WAITING_FOR_NOTES,
      expirationDate: validationResult.date,
    });

    return ctx.reply(
      'Please enter any notes about the medication (or type "-" if there are no notes):'
    );
  }

  private async handleMedicationName(
    ctx: TextMessageContext,
    chatId: number,
    conversation: ConversationData
  ) {
    await this.conversationStateService.setConversationState(chatId, {
      ...conversation,
      state: ConversationState.WAITING_FOR_EXPIRATION_DATE,
      medicationName: ctx.message.text,
    });

    return ctx.reply('Please enter the expiration date (YYYY-MM-DD):');
  }
}
