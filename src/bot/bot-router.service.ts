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
    private readonly userService: UserService,
    private readonly conversationStateService: ConversationStateService,
    private readonly medicationService: MedicationService,
    private readonly medicationValidator: MedicationValidator
  ) {}

  /**
   * Sets up command handlers for the bot
   * @param bot The Telegraf bot instance
   */
  async setupCommands(bot: Telegraf): Promise<void> {
    await bot.telegram.setMyCommands(this.commands);

    bot.start(async ctx => {
      const { telegramId } = this.userService.getUserInfo(ctx, ctx.chat.id);
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
      const userInfo = this.userService.getUserInfo(ctx, ctx.chat.id);

      try {
        const user = await this.userService.createOrGetUser(userInfo);
        console.log(
          `User created or found. telegramId=${user.telegramId}, chatId=${user.chatId}, username=${user.username}`
        );

        await this.conversationStateService.setConversationState(userInfo.chatId, {
          state: ConversationState.WAITING_FOR_MEDICATION_NAME,
        });

        return ctx.reply('Please enter the name of the medication:');
      } catch (e) {
        // todo add error message
        console.error('Could not create or get user', e);
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
          // todo log
          return ctx.reply('Sorry, something went wrong. Please try again.');
      }
    });
  }

  private async handleMedicationSave(ctx: TextMessageContext, chatId: number) {
    const conversation = await this.conversationStateService.getConversationState(chatId);
    if (conversation === undefined) {
      return ctx.reply(this.UNKNOWN_COMMAND);
    }

    try {
      const { telegramId } = this.userService.getUserInfo(ctx, chatId);
      const user = await this.userService.findUserByTelegramId(telegramId);
      if (user === null) {
        console.error(`Could not find user by telegram id: ${telegramId}`);
        return ctx.reply('Sorry, something went wrong. Please try again.');
      }

      const notes = ctx.message.text;
      const medicationData = this.medicationService.validateMedicationData(
        conversation.medicationName,
        conversation.expirationDate,
        notes
      );

      const medication = await this.medicationService.createMedication(user.id, medicationData);

      await this.conversationStateService.clearConversationState(chatId);

      return ctx.reply(`Medication "${medication.name}" has been added successfully!`);
    } catch (error) {
      console.error('Error saving medication:', error);
      await this.conversationStateService.clearConversationState(chatId);
      return ctx.reply('Sorry, there was an error saving your medication. Please try again.');
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
    const { date, errorMessage } = this.medicationValidator.validateExpirationDate(
      ctx.message.text
    );

    if (errorMessage) {
      return ctx.reply(errorMessage);
    }

    await this.conversationStateService.setConversationState(chatId, {
      ...conversation,
      state: ConversationState.WAITING_FOR_NOTES,
      expirationDate: date,
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
