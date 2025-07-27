import type { PrismaClient, Notification } from '@prisma/client';
import { startOfDay } from 'date-fns';
import type { NotificationWithMedication } from '../types/NotificationWithMedication.ts';

export class NotificationRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async createNotification(
    sendDate: Date,
    medicationId: number,
    chatId: number
  ): Promise<Notification | null> {
    return await this.prismaClient.notification.create({
      data: {
        sendDate,
        medicationId,
        chatId,
      },
    });
  }

  async getTodayNotificationsWithMedications(): Promise<NotificationWithMedication[]> {
    const today = startOfDay(new Date());

    const notifications = await this.prismaClient.notification.findMany({
      where: {
        sendDate: today,
      },
      include: {
        medication: true,
      },
    });

    const map = notifications.map(notification => ({
      ...notification,
      chatId: Number(notification.chatId),
    }));
    return map;
  }
}
