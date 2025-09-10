import { Context, Telegram } from 'telegraf';
import type { TelegramUserInfo } from './types/user-info.model.ts';
import type { NotificationWithMedication } from '../features/notification/types/NotificationWithMedication.ts';
import { format } from 'date-fns';
import logger from '../shared/logger/logger.ts';
import type { IUserService } from '../features/user/types/userService.interface.ts';
import {
  type ConversationData,
  ConversationState,
} from '../shared/conversation-state/conversation-state.types.ts';
import type { IConversationStateService } from '../shared/conversation-state/conversation-state.service.interface.ts';
import type { ActionContext, TextMessageContext } from './types/context.type.ts';
import type { IMedicationService } from '../features/medication/types/medication.service.interface.ts';
import type { IMedicationValidator } from '../features/medication/types/medication.validator.interface.ts';
import type { INotificationService } from '../features/notification/types/notification.service.interface.ts';

export class BotService {
  constructor(
    private readonly bot: Telegram,
    private readonly userService: IUserService,
    private readonly conversationStateService: IConversationStateService,
    private readonly medicationService: IMedicationService,
    private readonly medicationValidator: IMedicationValidator,
    private readonly notificationService: INotificationService
  ) {}

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
  private readonly BOT_IS_STARTED_MESSAGE = `You have already started bot. ${this.HELP_DESCRIPTION}`;

  async onStart(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    const { telegramId } = this.getTelegramUserInfo(ctx);
    const user = await this.userService.findUserByTelegramId(telegramId);

    if (user !== null) {
      return ctx.reply(this.BOT_IS_STARTED_MESSAGE);
    }

    return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
  }

  async onHelp(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    return ctx.reply(this.HELP_DESCRIPTION);
  }

  /**
   * Handles the cancellation of adding a new medication
   * @param ctx The Telegraf context
   * @returns A promise that resolves when the operation is complete
   */
  async onCancelAddMedication(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    const { chatId } = this.getTelegramUserInfo(ctx);

    try {
      await this.conversationStateService.clearConversationState(chatId);
      return ctx.reply('Adding medication has been cancelled.');
    } catch (error) {
      logger.error('Error cancelling medication addition:', { error });
      return ctx.reply('Sorry, there was an error cancelling the operation. Please try again.');
    }
  }

  async onAddMedication(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    const userInfo = this.getTelegramUserInfo(ctx);

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
  }

  async sendExpirationMessages(notifications: NotificationWithMedication[]) {
    for (const { chatId, medication } of notifications) {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '⏭️ Remind in 1 month',
              callback_data: `skip_${medication.id}`,
            },
            {
              text: '✅ Remove medication',
              callback_data: `accept_${medication.id}`,
            },
          ],
        ],
      };

      const formattedDate = format(medication.expirationDate, 'yyyy-MM-dd');

      await this.bot.sendMessage(
        chatId,
        `Medication ${medication.name} will expire ${formattedDate}`,
        {
          reply_markup: keyboard,
          parse_mode: 'Markdown',
        }
      );
    }
  }

  async onText(ctx: TextMessageContext) {
    const chatId = ctx.chat.id;
    const conversation = await this.conversationStateService.getConversationState(chatId);

    if (conversation === undefined) {
      return ctx.reply(this.UNKNOWN_COMMAND);
    }

    try {
      switch (conversation.state) {
        case ConversationState.WAITING_FOR_MEDICATION_NAME:
          return await this.handleMedicationName(ctx, chatId, conversation);
        case ConversationState.WAITING_FOR_EXPIRATION_DATE:
          return await this.handleExpirationDate(ctx, chatId, conversation);
        case ConversationState.WAITING_FOR_NOTES:
          await this.handleNotes(ctx.message.text, chatId, conversation);
          return await this.handleMedicationSave(ctx, chatId);
        default:
          logger.error('Unknown conversation state', { conversation, chatId });
          throw new Error('Unknown conversation state');
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

      await this.conversationStateService.clearConversationState(chatId); // todo cover with test
      return ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  async sendDueNotifications(): Promise<void> {
    try {
      const notifications = await this.notificationService.getTodayNotificationsWithMedications();
      await this.sendExpirationMessages(notifications);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Failed to send notifications today.`, {
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error(`Failed to send notifications today.`, {
          error: String(e),
        });
      }
    }
  }

  // todo
  async onSkipNotification(ctx: ActionContext) {
    if (!ctx.match) {
      throw new Error('Something went wrong. Please try again later.');
    }

    const medicationId = parseInt(ctx.match[1]);
    const result = await this.handleSkipNotification(medicationId);

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
  }

  // todo
  async onAcceptNotification(ctx: ActionContext) {
    if (!ctx.match) {
      throw new Error('Something went wrong. Please try again later.');
    }

    const medicationId = parseInt(ctx.match[1]);
    const result = await this.handleAcceptNotification(medicationId);

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
  }

  // todo where to place this method? in botservice or notification service?
  private async handleSkipNotification(medicationId: number) {
    console.log(`handleSkipNotification for ${medicationId}`);
    // TODO update notification date
    return {
      success: true,
      medication: {
        name: 'm1',
      },
    };
  }

  // todo
  private async handleAcceptNotification(medicationId: number) {
    console.log(`handleAcceptNotification for ${medicationId}`);
    // todo remove notification and medication
    return {
      success: true,
      medication: {
        name: 'm1',
      },
    };
  }

  private async handleMedicationSave(ctx: TextMessageContext, chatId: number) {
    const conversation = await this.conversationStateService.getConversationState(chatId);
    if (conversation === undefined) {
      logger.error('Could not find conversation state.', {
        chatId,
      });
      throw new Error('Could not find conversation state.');
    }

    const notes = ctx.message.text;
    const validationResult = this.medicationValidator.validateMedicationData(
      conversation.medicationName,
      conversation.expirationDate,
      notes
    );

    if (!validationResult.isValid) {
      logger.error(`${validationResult.error}`, {
        chatId,
        error: validationResult.error,
      });
      return ctx.reply(`${validationResult.error}`);
    }

    try {
      const { telegramId } = this.getTelegramUserInfo(ctx);
      const user = await this.userService.findUserByTelegramId(telegramId);
      if (user == null) {
        logger.error(`Could not find user by telegram id`, { telegramId });
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

  private getTelegramUserInfo(ctx: Context): TelegramUserInfo {
    logger.debug(`Try to get telegram user info`, { ctxFrom: JSON.stringify(ctx.from) });

    if (ctx.from == null) {
      logger.error(`No user information in context`, { ctx: String(ctx) });
      throw new Error('No user information in context');
    }

    const chatId = ctx.chat?.id;

    const telegramId = ctx.from.id;
    if (chatId == null) {
      logger.error(`No chatId for user`, { telegramId });
      throw new Error(`No chatId for user: ${telegramId}`);
    }

    return {
      telegramId,
      chatId: chatId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    };
  }
}
