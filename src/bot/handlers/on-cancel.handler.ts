import type { BotCommandHandler } from '../types/bot-command-handler.interface.ts';
import type { BotContext, TextMessage } from '../types/context.type.ts';
import type { BotService } from '../bot.service.ts';
import logger from '../../shared/logger/logger.ts';
import type { IConversationStateService } from '../../shared/conversation-state/conversation-state.service.interface.ts';

export class OnCancelHandler implements BotCommandHandler<BotContext> {
  constructor(
    private readonly botService: BotService,
    private readonly conversationStateService: IConversationStateService
  ) {}

  async handle(ctx: BotContext): Promise<TextMessage> {
    const { chatId } = this.botService.getTelegramUserInfo(ctx);

    try {
      await this.conversationStateService.clearConversationState(chatId);
      return ctx.reply('Adding medication has been cancelled.');
    } catch (error) {
      logger.error('Error cancelling medication addition:', { error });
      return ctx.reply('Sorry, there was an error cancelling the operation. Please try again.');
    }
  }
}
