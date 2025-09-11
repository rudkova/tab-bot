import type { BotCommandHandler } from '../types/bot-command-handler.interface.ts';
import type { TextMessage, TextMessageContext } from '../types/context.type.ts';
import {
  type ConversationData,
  ConversationState,
} from '../../shared/conversation-state/conversation-state.types.ts';
import logger from '../../shared/logger/logger.ts';
import type { BotService } from '../bot.service.ts';
import type { IConversationStateService } from '../../shared/conversation-state/conversation-state.service.interface.ts';
import type { IUserService } from '../../features/user/types/userService.interface.ts';
import type { IMedicationService } from '../../features/medication/types/medication.service.interface.ts';
import type { IMedicationValidator } from '../../features/medication/types/medication.validator.interface.ts';
import type { INotificationService } from '../../features/notification/types/notification.service.interface.ts';

export class AddMedicationTextHandler implements BotCommandHandler<TextMessageContext> {
  constructor(
    private readonly botService: BotService,
    private readonly conversationStateService: IConversationStateService,
    private readonly userService: IUserService,
    private readonly medicationService: IMedicationService,
    private readonly medicationValidator: IMedicationValidator,
    private readonly notificationService: INotificationService
  ) {}

  private readonly UNKNOWN_COMMAND = `Unknown command.`;

  async handle(ctx: TextMessageContext): Promise<TextMessage> {
    const chatId = ctx.chat.id;
    const conversation = await this.conversationStateService.getConversationState(chatId);

    if (conversation === undefined) {
      return ctx.reply(`${this.UNKNOWN_COMMAND}\n${this.botService.getHelpDescription()}`);
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
      const { telegramId } = this.botService.getTelegramUserInfo(ctx);
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
}
