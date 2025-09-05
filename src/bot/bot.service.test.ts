import { type Context, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import type { Message } from 'telegraf/typings/core/types/typegram';
import type { IUserService } from '../features/user/types/userService.interface.ts';
import type { User } from '@prisma/client';
import type { IConversationStateService } from '../shared/conversation-state/conversation-state.service.interface.ts';

jest.mock('../configs/config.ts', () => ({
  config: {
    bot: { token: 'test-token' },
    app: {
      env: 'test',
      dateFormat: 'yyyy-MM-dd',
      defaultTZ: 'UTC',
      logLevel: 'silent',
    },
    database: { url: 'file:./test.db' },
  },
}));

describe('BotService', () => {
  const CHAT_ID = 123;
  let bot: Telegraf;
  let userService: jest.Mocked<IUserService>;
  let conversationStateService: jest.Mocked<IConversationStateService>;
  let botService: BotService;
  let ctx: Context;

  beforeEach(async () => {
    bot = new Telegraf('test-fake-token');
    userService = {
      findUserByTelegramId: jest.fn(),
      createOrGetUser: jest.fn(),
    };
    conversationStateService = {
      getConversationState: jest.fn(),
      setConversationState: jest.fn(),
      clearConversationState: jest.fn(),
    };
    botService = new BotService(bot.telegram, userService, conversationStateService);

    ctx = {
      chat: { id: CHAT_ID },
      from: { id: CHAT_ID },
      reply: async (text: string) => bot.telegram.sendMessage(CHAT_ID, text),
    } as Context;

    // Intercept all outgoing Telegram messages
    bot.telegram.sendMessage = jest.fn().mockImplementation(async (chatId, text) => {
      return {
        message_id: Math.floor(Math.random() * 1000),
        chat: { id: chatId },
        text,
      } as unknown as Message.TextMessage;
    });
  });

  describe('onStart', () => {
    it('should return welcome message when user is new', async () => {
      userService.findUserByTelegramId.mockResolvedValue(null);

      const result = await botService.onStart(ctx);

      expect(result.text).toBe(
        'Welcome to Tab-Bot! I can help you track your medicine expiration dates.'
      );
    });

    it('should return "bot is started" message when user is not new', async () => {
      userService.findUserByTelegramId.mockResolvedValue(generateUser(BigInt(CHAT_ID)));

      const result = await botService.onStart(ctx);

      expect(result.text).toContain('You have already started bot');
    });
  });

  describe('onHelp', () => {
    it('should return a list of available commands', async () => {
      const result = await botService.onHelp(ctx);
      expect(result.text).toContain('Available commands:'); // todo add precise message when extract commands
    });
  });

  describe('onAddMedication', () => {
    it('should return a "Please enter the name of the medication" message', async () => {
      userService.createOrGetUser.mockResolvedValue(generateUser(BigInt(CHAT_ID)));

      const result = await botService.onAddMedication(ctx);

      expect(result.text).toBe('Please enter the name of the medication:');
    });
  });

  describe('onCancelAddMedication', () => {
    it('should clear conversation state and return a cancellation message', async () => {
      conversationStateService.clearConversationState.mockResolvedValue(undefined);

      const result = await botService.onCancelAddMedication(ctx);

      // Verify the correct message is returned
      expect(result.text).toBe('Adding medication has been cancelled.');
    });
  });
});

const generateUser = (chatId: bigint): User => ({
  id: 1,
  telegramId: 1n,
  chatId,
  username: 'test-username',
  firstName: 'test-firstName',
  timezone: 'test-tz',
  createdAt: new Date(),
  updatedAt: null,
});
