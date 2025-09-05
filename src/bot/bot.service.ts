import { Context, Telegram } from 'telegraf';
import type { TelegramUserInfo } from './types/user-info.model.ts';
import type { NotificationWithMedication } from '../features/notification/types/NotificationWithMedication.ts';
import { format } from 'date-fns';
import logger from '../shared/logger/logger.ts';
import type { IUserService } from '../features/user/types/userService.interface.ts';
import { ConversationState } from '../shared/conversation-state/conversation-state.types.ts';
import type { IConversationStateService } from '../shared/conversation-state/conversation-state.service.interface.ts';

export class BotService {
  constructor(
    private readonly bot: Telegram,
    private readonly userService: IUserService,
    private readonly conversationStateService: IConversationStateService
  ) {}

  private readonly commands = [
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Show help message' },
    { command: 'add_medication', description: 'Add a new medication' },
    { command: 'cancel_add_medication', description: 'Cancel adding a new medication' },
    { command: 'contact_developer', description: 'Contact the developer' },
  ];
  private readonly HELP_DESCRIPTION =
    'Available commands:\n' +
    `${this.commands.map(c => `/${c.command} - ${c.description}`).join('\n')}`;

  private readonly BOT_IS_STARTED_MESSAGE = `You have already started bot. ${this.HELP_DESCRIPTION}`;

  async onStart(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    const { telegramId } = this.getTelegramUserInfo(ctx);
    const user = await this.userService.findUserByTelegramId(telegramId);

    if (user !== null) {
      return ctx.reply(this.BOT_IS_STARTED_MESSAGE);
    }

    return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
  }

  async onHelp(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    return ctx.reply(this.HELP_DESCRIPTION);
  }

  /**
   * Handles the cancellation of adding a new medication
   * @param ctx The Telegraf context
   * @returns A promise that resolves when the operation is complete
   */
  async onCancelAddMedication(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    const { chatId } = this.getTelegramUserInfo(ctx);

    try {
      await this.conversationStateService.clearConversationState(chatId);
      return ctx.reply('Adding medication has been cancelled.');
    } catch (error) {
      logger.error('Error cancelling medication addition:', { error });
      return ctx.reply('Sorry, there was an error cancelling the operation. Please try again.');
    }
  }

  async onAddMedication(ctx: Context): Promise<ReturnType<typeof ctx.reply>> {
    const userInfo = this.getTelegramUserInfo(ctx);

    try {
      const user = await this.userService.createOrGetUser(userInfo);
      logger.debug(`User created or found.`, { id: user.id });

      await this.conversationStateService.setConversationState(userInfo.chatId, {
        state: ConversationState.WAITING_FOR_MEDICATION_NAME,
      });

      return ctx.reply('Please enter the name of the medication:');
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Failed to create or get user.`, {
          userInfo,
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error(`Failed to create or get user.`, {
          userInfo,
          error: String(e),
        });
      }

      return ctx.reply('Sorry, I could not identify you. Please try again later.');
    }
  }

  /**
   * Extracts user information from the Telegraf context
   * @param ctx The Telegraf context
   * @returns User information
   */
  getTelegramUserInfo(ctx: Context): TelegramUserInfo {
    logger.debug(`Try to get telegram user info`, { ctxFrom: JSON.stringify(ctx.from) });

    if (ctx.from == null) {
      logger.error(`No user information in context`, { ctx: String(ctx) });
      throw new Error('No user information in context');
    }

    const chatId = ctx.chat?.id;

    const telegramId = ctx.from.id;
    if (chatId == null) {
      logger.error(`No chatId for user`, { telegramId });
      throw new Error(`No chatId for user: ${telegramId}`);
    }

    return {
      telegramId,
      chatId: chatId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    };
  }

  async sendExpirationMessages(notifications: NotificationWithMedication[]) {
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
