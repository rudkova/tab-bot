import type { PrismaClient, Notification } from '@prisma/client';
import type { NotificationWithMedication } from '../types/NotificationWithMedication.ts';
import { getEndOfDay, getStartOfDay } from '../../../shared/utils/date.util.ts';

export class NotificationRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async createNotification(
    sendDate: Date,
    medicationId: number,
    chatId: number
  ): Promise<Notification> {
    return await this.prismaClient.notification.create({
      data: {
        sendDate,
        medicationId,
        chatId,
      },
    });
  }

  async getTodayNotificationsWithMedications(): Promise<NotificationWithMedication[]> {
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();

    const notifications = await this.prismaClient.notification.findMany({
      where: {
        sendDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        medication: true,
      },
    });

    return notifications.map(notification => ({
      ...notification,
      chatId: Number(notification.chatId),
    }));
  }
}
