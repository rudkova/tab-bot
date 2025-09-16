import logger from '../shared/logger/logger.ts';
import cron from 'node-cron';
import type { BotService } from '../bot/bot.service.ts';
import { logError } from '../shared/utils/error-logger.util.ts';

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
        await this.botService.sendTodayNotifications();
        logger.info('Cron Job. Daily notification check completed');
      } catch (e) {
        logError('Cron Job. Error in daily notification send', e);
      }
    });

    logger.info(`Notification cron job scheduled with pattern ${this.pattern}`);
  }
}
