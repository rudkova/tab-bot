import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
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

  constructor(private readonly botService: BotService) {}

  /**
   * Sets up command handlers for the bot
   * @param bot The Telegraf bot instance
   */
  async setupCommands(bot: Telegraf): Promise<void> {
    logger.info('Bot setup commands', { commands: this.commands });
    await bot.telegram.setMyCommands(this.commands);
    await this.setupNotificationHandlers(bot);

    bot.start(ctx => this.botService.onStart(ctx));

    bot.help(ctx => this.botService.onHelp(ctx));

    bot.command('add_medication', async ctx => this.botService.onAddMedication(ctx));

    bot.command('cancel_add_medication', async ctx => this.botService.onCancelAddMedication(ctx));

    // Write to developer command
    bot.command('contact_developer', ctx => {
      return ctx.reply(
        'If you have any questions or suggestions, please write them here and they will be forwarded to the developer.'
      );
    });

    bot.on(message('text'), async ctx => this.botService.onText(ctx));
  }

  private async setupNotificationHandlers(bot: Telegraf): Promise<void> {
    bot.action(/skip_(\d+)/, async ctx => this.botService.onSkipNotification(ctx));

    bot.action(/accept_(\d+)/, async ctx => this.botService.onAcceptNotification(ctx));
  }
}
