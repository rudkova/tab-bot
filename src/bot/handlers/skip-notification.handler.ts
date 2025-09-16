import type { BotCommandHandler } from '../types/bot-command-handler.interface.ts';
import type { ActionContext, TextMessage } from '../types/context.type.ts';
import type { BotService } from '../bot.service.ts';
import type { IUserService } from '../../features/user/types/userService.interface.ts';

export class SkipNotificationHandler implements BotCommandHandler<ActionContext> {
  constructor(
    private readonly botService: BotService,
    private readonly userService: IUserService
  ) {}

  async handle(ctx: ActionContext): Promise<TextMessage> {
    return ctx.reply('');
  }
}
