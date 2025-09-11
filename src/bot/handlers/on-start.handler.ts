import type { BotCommandHandler } from '../types/bot-command-handler.interface.ts';
import type { BotContext, TextMessage } from '../types/context.type.ts';
import type { BotService } from '../bot.service.ts';
import type { IUserService } from '../../features/user/types/userService.interface.ts';

export class OnStartHandler implements BotCommandHandler<BotContext> {
  constructor(
    private readonly botService: BotService,
    private readonly userService: IUserService
  ) {}

  private readonly BOT_IS_STARTED_MESSAGE = `You have already started bot.`;

  async handle(ctx: BotContext): Promise<TextMessage> {
    const { telegramId } = this.botService.getTelegramUserInfo(ctx);
    const user = await this.userService.findUserByTelegramId(telegramId);

    if (user !== null) {
      return ctx.reply(`${this.BOT_IS_STARTED_MESSAGE}\n${this.botService.getHelpDescription()}`);
    }

    return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
  }
}
