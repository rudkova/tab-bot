import type { NotificationWithMedication } from './NotificationWithMedication.ts';

export interface INotificationService {
  createNotification(medicationId: number, expirationDate: Date, chatId: number): Promise<void>;
  getTodayNotificationsWithMedications(): Promise<NotificationWithMedication[]>;
}
