import logger from '../../../shared/logger/logger.ts';
import { NotificationRepository } from './notification.repository.ts';
import type { BotService } from '../../../bot/bot.service.ts';
import { formatDate, getStartOfDay } from '../../../shared/utils/date.util.ts';
import type { NotificationWithMedication } from '../types/NotificationWithMedication.ts';

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

    if (notificationDate === null) {
      throw new Error(`Fail to create notification date by expirationDate: ${expirationDate}`);
    }

    try {
      logger.info(
        `Try to create notification with expirationDate: ${formatDate(expirationDate)}, medicationId ${medicationId}`
      );
      const { id } = await this.notificationRepository.createNotification(
        notificationDate,
        medicationId,
        chatId
      );
      logger.debug(
        `Notification is created: id:${id}, date:${formatDate(expirationDate)}, chatId:${chatId}, medicationId:${medicationId}.`
      );
    } catch (e) {
      if (e instanceof Error) {
        logger.error('Failed to create notification.', {
          notificationData: {
            medicationId,
            expirationDate,
            chatId,
          },
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error('Failed to create notification.', {
          notificationData: {
            medicationId,
            expirationDate,
            chatId,
          },
          error: String(e),
        });
      }
      throw e;
    }
  }

  async getTodayNotificationsWithMedications(): Promise<NotificationWithMedication[]> {
    try {
      const notifications =
        await this.notificationRepository.getTodayNotificationsWithMedications();
      logger.info(`Todays notifications: ${JSON.stringify(notifications, null, 2)}`);
      return notifications;
    } catch (e) {
      logger.error('Failed to fetch today notifications', e);
      throw e;
    }
  }

  async sendDueNotifications(): Promise<void> {
    try {
      const notifications = await this.getTodayNotificationsWithMedications();
      await this.botService.sendExpirationMessages(notifications);
    } catch (e) {
      logger.error('Failed to send notifications today', e);
    }
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

  // todo
  async handleSkipNotification(medicationId: number) {
    console.log(`handleSkipNotification for ${medicationId}`);
    return {
      success: true,
      medication: {
        name: 'm1',
      },
    };
  }

  // todo
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
