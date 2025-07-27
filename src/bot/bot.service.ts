import { Context, Telegram } from 'telegraf';
import type { TelegramUserInfo } from './types/user-info.model.ts';
import type { NotificationWithMedication } from '../features/notification/types/NotificationWithMedication.ts';
import { format } from 'date-fns';

export class BotService {
  constructor(private readonly bot: Telegram) {}

  /**
   * Extracts user information from the Telegraf context
   * @param ctx The Telegraf context
   * @returns User information
   */
  getTelegramUserInfo(ctx: Context): TelegramUserInfo {
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

  async sendExpirationMessages(notifications: NotificationWithMedication[]) {
    console.log('sendExpirationMessages');
    for (const { chatId, medication } of notifications) {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '⏭️ Remind in 1 month',
              callback_data: `skip_${medication.id}`,
            },
            {
              text: '✅ Remove medication',
              callback_data: `accept_${medication.id}`,
            },
          ],
        ],
      };

      const formattedDate = format(medication.expirationDate, 'yyyy-MM-dd');

      await this.bot.sendMessage(
        chatId,
        `Medication ${medication.name} will expire ${formattedDate}`,
        {
          reply_markup: keyboard,
          parse_mode: 'Markdown',
        }
      );
    }
  }
}
