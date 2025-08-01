import { NotificationRepository } from './notification.repository.ts';
import type { BotService } from '../../../bot/bot.service.ts';
import { getStartOfDay } from '../../../shared/utils/date.util.ts';

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly botService: BotService
  ) {}

  /**
   * Set notification date for a medication
   */
  async createNotification(
    medicationId: number,
    expirationDate: Date,
    chatId: number
  ): Promise<void> {
    // const notificationDate = this.calculateNotificationDate(expirationDate);
    const notificationDate = getStartOfDay(); // TODO remove. use calculateNotificationDate

    if (notificationDate) {
      await this.notificationRepository.createNotification(notificationDate, medicationId, chatId);

      console.log(`Scheduled notification for medication ${medicationId} at ${notificationDate}`);
    } else {
      console.log(`Medication ${medicationId} expires too soon, no notification scheduled`);
    }
  }

  async sendDueNotifications() {
    console.log('sendDueNotifications');
    const notifications = await this.notificationRepository.getTodayNotificationsWithMedications();
    console.log('notifications', notifications);
    await this.botService.sendExpirationMessages(notifications);
  }

  // todo from 6 to 2 months before expiration. now it works only for 6 months
  //  add the second param so the method work for creating next notifications
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

  async handleSkipNotification(medicationId: number) {
    console.log(`handleSkipNotification for ${medicationId}`);
    return {
      success: true,
      medication: {
        name: 'm1',
      },
    };
  }

  async handleAcceptNotification(medicationId: number) {
    console.log(`handleAcceptNotification for ${medicationId}`);
    return {
      success: true,
      medication: {
        name: 'm1',
      },
    };
  }
}
