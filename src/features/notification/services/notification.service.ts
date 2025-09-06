import logger from '../../../shared/logger/logger.ts';
import { NotificationRepository } from './notification.repository.ts';
import { formatDate, getStartOfDay } from '../../../shared/utils/date.util.ts';
import type { NotificationWithMedication } from '../types/NotificationWithMedication.ts';
import { replaceWithoutProps } from '../../../shared/utils/string.util.ts';
import type { INotificationService } from '../types/notification.service.interface.ts';

export class NotificationService implements INotificationService {
  private readonly sensitiveFields;

  constructor(private readonly notificationRepository: NotificationRepository) {
    this.sensitiveFields = new Map<string, string>();
    this.sensitiveFields.set('medication', '');
  }

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
      logger.info('Try to create notification.', {
        expirationDate: formatDate(expirationDate),
        medicationId,
      });
      const { id } = await this.notificationRepository.createNotification(
        notificationDate,
        medicationId,
        chatId
      );
      logger.debug('Notification is created', {
        id,
        date: formatDate(expirationDate),
        chatId,
        medicationId,
      });
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

      logger.info('Today notifications.', {
        notifications: JSON.stringify(notifications, replaceWithoutProps(this.sensitiveFields)),
      });
      return notifications;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Failed to fetch today notifications.`, {
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error(`Failed to fetch today notifications.`, {
          error: String(e),
        });
      }

      throw e;
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
}
