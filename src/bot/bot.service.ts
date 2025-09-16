import { Context, Telegram, Markup } from 'telegraf';
import type { TelegramUserInfo } from './types/user-info.model.ts';
import { format } from 'date-fns';
import logger from '../shared/logger/logger.ts';
import type { ActionContext } from './types/context.type.ts';
import type { INotificationService } from '../features/notification/types/notification.service.interface.ts';

export class BotService {
  constructor(
    private readonly bot: Telegram,
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

  async sendTodayNotifications(): Promise<void> {
    try {
      const notifications = await this.notificationService.getTodayNotificationsWithMedications();

      for (const { chatId, medication } of notifications) {
        const formattedDate = format(medication.expirationDate, 'yyyy-MM-dd');
        const timestamp = Date.now();

        await this.bot.sendMessage(
          chatId,
          `Medication ${medication.name} will expire ${formattedDate}`,
          {
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  '✅ Remove medication',
                  `accept_${medication.id}_${timestamp}`
                ),
                Markup.button.callback(
                  '⏭️ Remind in 1 month',
                  `skip_${medication.id}_${timestamp}`
                ),
              ],
            ]).reply_markup,
            parse_mode: 'Markdown',
          }
        );
      }
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

  getTelegramUserInfo(ctx: Context): TelegramUserInfo {
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

  getHelpDescription(): string {
    return this.HELP_DESCRIPTION;
  }
}
