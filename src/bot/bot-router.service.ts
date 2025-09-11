import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import logger from '../shared/logger/logger.ts';
import type { AddMedicationHandler } from './handlers/add-medication.handler.ts';
import type { AddMedicationTextHandler } from './handlers/add-medication-text-handler.ts';
import { OnStartHandler } from './handlers/on-start.handler.ts';
import type { OnHelpHandler } from './handlers/on-help.handler.ts';
import type { OnCancelHandler } from './handlers/on-cancel.handler.ts';

export class BotRouterService {
  private readonly commands = [
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Show help message' },
    { command: 'add_medication', description: 'Add a new medication' },
    { command: 'cancel_add_medication', description: 'Cancel adding a new medication' },
    { command: 'contact_developer', description: 'Contact the developer' },
  ];

  constructor(
    private readonly onStartHandler: OnStartHandler,
    private readonly onHelpHandler: OnHelpHandler,
    private readonly addMedicationHandler: AddMedicationHandler,
    private readonly textHandler: AddMedicationTextHandler,
    private readonly onCancelHandler: OnCancelHandler
  ) {}

  /**
   * Sets up command handlers for the bot
   * @param bot The Telegraf bot instance
   */
  async setupCommands(bot: Telegraf): Promise<void> {
    logger.info('Bot setup commands', { commands: this.commands });
    await bot.telegram.setMyCommands(this.commands);
    await this.setupNotificationHandlers(/*bot*/);

    bot.start(ctx => this.onStartHandler.handle(ctx));

    bot.help(ctx => this.onHelpHandler.handle(ctx));

    bot.command('add_medication', async ctx => this.addMedicationHandler.handle(ctx));

    bot.command('cancel_add_medication', async ctx => this.onCancelHandler.handle(ctx));

    // Write to developer command
    bot.command('contact_developer', ctx => {
      return ctx.reply(
        'If you have any questions or suggestions, please write them here and they will be forwarded to the developer.'
      );
    });

    bot.on(message('text'), async ctx => this.textHandler.handle(ctx));
  }

  private async setupNotificationHandlers(/*bot: Telegraf*/): Promise<void> {
    // todo call separate handelrs
    // bot.action(/skip_(\d+)/, async ctx => this.botService.onSkipNotification(ctx));
    // bot.action(/accept_(\d+)/, async ctx => this.botService.onAcceptNotification(ctx));
  }
}
