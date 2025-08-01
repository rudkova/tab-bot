import logger from '../shared/logger/logger.ts';
import cron from 'node-cron';
import type { NotificationService } from '../features/notification/services/notification.service.ts';

export class NotificationCron {
  constructor(private readonly notificationService: NotificationService) {}

  private readonly pattern = '0 20 * * *';
  /**
   * Start the daily notification cron job
   */
  start(): void {
    cron.schedule(this.pattern, async () => {
      logger.info('Cron Job. Started');
      try {
        await this.notificationService.sendDueNotifications();
        logger.info('Cron Job. Finished');
        console.log('Daily notification check completed');
      } catch (error) {
        logger.error(`Error. Cron Job.\n ${error}`);
        console.error('Error in daily notification check:', error);
      }
    });

    logger.info(`Notification cron job scheduled with pattern ${this.pattern}`);
  }
}
