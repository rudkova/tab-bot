import { Context, Telegram } from 'telegraf';
import type { Notification } from '@prisma/client';
import type { UserInfo } from '../features/user/models/user-info.model.ts';

export class BotService {
  constructor(private readonly telegramBot: Telegram) {}

  /**
   * Extracts user information from the Telegraf context
   * @param ctx The Telegraf context
   * @returns User information
   */
  getTelegramUserInfo(ctx: Context): UserInfo {
    if (!ctx.from) {
      throw new Error(`No user information in context. ${JSON.stringify(ctx, null, 2)}`);
    }

    const chatId = ctx.chat?.id;

    if (chatId === undefined) {
      throw new Error(`No chatId for user: ${ctx.from.id}`);
    }

    return {
      chatId: chatId,
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    };
  }

  sendExpirationMessages(notifications: Notification[]) {
    for (const notification of notifications) {
      const chatId = notification.chatId.toString();
      this.telegramBot.sendMessage(chatId, 'message from bot').catch(error => {
        console.error(`Failed to send message to ${chatId}:`, error);
      });
    }
  }
}
