import type { BotCommandHandler } from '../types/bot-command-handler.interface.ts';
import type { BotContext, TextMessage } from '../types/context.type.ts';
import type { BotService } from '../bot.service.ts';

export class OnHelpHandler implements BotCommandHandler<BotContext> {
  constructor(private readonly botService: BotService) {}

  async handle(ctx: BotContext): Promise<TextMessage> {
    return ctx.reply(this.botService.getHelpDescription());
  }
}
