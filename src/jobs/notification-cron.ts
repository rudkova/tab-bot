import cron from 'node-cron';
import type { NotificationService } from '../features/notification/services/notification.service.ts';

export class NotificationCron {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Start the daily notification cron job
   */
  start(): void {
    // Run every day at 20:00
    cron.schedule('0 20 * * *', async () => {
      console.log('Running daily notifications');
      try {
        await this.notificationService.sendDueNotifications();
        console.log('Daily notification check completed');
      } catch (error) {
        console.error('Error in daily notification check:', error);
      }
    });

    console.log('Notification cron job scheduled');
  }
}
