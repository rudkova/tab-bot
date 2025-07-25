import { Telegram } from 'telegraf';
import type { Notification } from '@prisma/client';

export class BotService {
  constructor(private readonly telegramBot: Telegram) {}

  sendMessage(notifications: Notification[]) {
    for (const notification of notifications) {
      const chatId = notification.chatId.toString();
      this.telegramBot.sendMessage(chatId, 'message from bot').catch(error => {
        console.error(`Failed to send message to ${chatId}:`, error);
      });
    }
  }
}
