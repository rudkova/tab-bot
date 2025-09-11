import type { BotCommandHandler } from '../types/bot-command-handler.interface.ts';
import type { BotContext, TextMessage } from '../types/context.type.ts';
import logger from '../../shared/logger/logger.ts';
import { ConversationState } from '../../shared/conversation-state/conversation-state.types.ts';
import type { BotService } from '../bot.service.ts';
import type { IConversationStateService } from '../../shared/conversation-state/conversation-state.service.interface.ts';
import type { IUserService } from '../../features/user/types/userService.interface.ts';

export class AddMedicationHandler implements BotCommandHandler<BotContext> {
  constructor(
    private readonly botService: BotService,
    private readonly conversationStateService: IConversationStateService,
    private readonly userService: IUserService
  ) {}

  async handle(ctx: BotContext): Promise<TextMessage> {
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
  }
}
