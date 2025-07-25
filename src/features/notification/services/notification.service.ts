import { NotificationRepository } from './notification.repository.ts';
import { startOfDay } from 'date-fns';

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  /**
   * Set notification date for a medication
   */
  async createNotification(
    medicationId: number,
    expirationDate: Date,
    chatId: bigint
  ): Promise<void> {
    // const notificationDate = this.calculateNotificationDate(expirationDate);
    const notificationDate = startOfDay(new Date());

    if (notificationDate) {
      await this.notificationRepository.createNotification(notificationDate, medicationId, chatId);

      console.log(`Scheduled notification for medication ${medicationId} at ${notificationDate}`);
    } else {
      console.log(`Medication ${medicationId} expires too soon, no notification scheduled`);
    }
  }

  async sendDueNotifications() {
    const notifications = await this.notificationRepository.getTodayNotifications();
    console.log('notifications', notifications);
    // bot.send notifications
  }

  // todo from 6 to 2 months before expiration. now it works only for 6 months
  // todo add the second param so the method work for creating next notifications
  /**
   * Calculate the initial notification date (from 6 to 2 months before expiration)
   */
  private calculateNotificationDate(expirationDate: Date): Date | null {
    const notificationDate = new Date(expirationDate); //date-fns
    notificationDate.setMonth(notificationDate.getMonth() - 6);

    // Don't schedule if the date is in the past
    if (notificationDate <= new Date()) {
      return null;
    }

    return notificationDate;
  }
}
