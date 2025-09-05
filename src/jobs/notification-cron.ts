import logger from '../shared/logger/logger.ts';
import cron from 'node-cron';
import type { BotService } from '../bot/bot.service.ts';

export class NotificationCron {
  constructor(private readonly botService: BotService) {}

  private readonly pattern = '0 20 * * *';
  /**
   * Start the daily notification cron job
   */
  start(): void {
    cron.schedule(this.pattern, async () => {
      logger.info('Cron Job. Started');
      try {
        await this.botService.sendDueNotifications();
        logger.info('Cron Job. Daily notification check completed');
      } catch (e) {
        if (e instanceof Error) {
          logger.error(`Cron Job. Error in daily notification send.`, {
            error: e.message,
            stack: e.stack,
          });
        } else {
          logger.error(`Cron Job. Error in daily notification send.`, {
            error: String(e),
          });
        }
      }
    });

    logger.info(`Notification cron job scheduled with pattern ${this.pattern}`);
  }
}
