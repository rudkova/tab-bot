import { NotificationRepository } from './notification.repository.ts';

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}
  /**
   * Set notification date for a medication
   */
  async createNotification(medicationId: number, expirationDate: Date): Promise<void> {
    const notificationDate = this.calculateInitialNotificationDate(expirationDate);

    if (notificationDate) {
      // await this.prisma.medication.update({
      //   where: { id: medicationId },
      //   data: { nextNotificationDate: notificationDate },
      // });

      console.log(`Scheduled notification for medication ${medicationId} at ${notificationDate}`);
    } else {
      console.log(`Medication ${medicationId} expires too soon, no notification scheduled`);
    }
  }

  /**
   * Calculate the initial notification date (from 6 to 2 months before expiration)
   */
  calculateInitialNotificationDate(expirationDate: Date): Date | null {
    const notificationDate = new Date(expirationDate);
    notificationDate.setMonth(notificationDate.getMonth() - 6);

    // Don't schedule if the date is in the past
    if (notificationDate <= new Date()) {
      return null;
    }

    return notificationDate;
  }
}
