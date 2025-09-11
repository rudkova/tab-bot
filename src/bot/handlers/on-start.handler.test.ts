import type { BotContext } from '../types/context.type.ts';
import { BotService } from '../bot.service.ts';
import type { IUserService } from '../../features/user/types/userService.interface.ts';
import {
  DEFAULT_TEST_CHAT_ID,
  DEFAULT_TEST_USER_ID,
  generateUser,
} from '../../__test-utils__/generator.ts';
import { OnStartHandler } from './on-start.handler.ts';
import type { INotificationService } from '../../features/notification/types/notification.service.interface.ts';
import { testBot } from '../../jest.setup.ts';

describe('onStart', () => {
  let ctx: BotContext;
  let botService: BotService;
  let onStartHandler: OnStartHandler;

  let mockNotificationService: jest.Mocked<INotificationService>;
  let mockUserService: jest.Mocked<IUserService>;

  beforeEach(() => {
    ctx = {
      chat: { id: DEFAULT_TEST_CHAT_ID },
      from: { id: DEFAULT_TEST_CHAT_ID },
      reply: async (text: string) => testBot.telegram.sendMessage(DEFAULT_TEST_CHAT_ID, text),
    } as BotContext;

    mockUserService = {
      findUserByTelegramId: jest.fn().mockImplementation(() => {
        return generateUser(DEFAULT_TEST_USER_ID, BigInt(DEFAULT_TEST_CHAT_ID));
      }),
      createOrGetUser: jest.fn().mockImplementation(() => {
        return generateUser(DEFAULT_TEST_USER_ID, BigInt(DEFAULT_TEST_CHAT_ID));
      }),
    };
    mockNotificationService = {
      createNotification: jest.fn(),
      getTodayNotificationsWithMedications: jest.fn(),
    };

    botService = new BotService(testBot.telegram, mockNotificationService);
    onStartHandler = new OnStartHandler(botService, mockUserService);
  });

  it('should return welcome message when user is new', async () => {
    mockUserService.findUserByTelegramId.mockResolvedValue(null);

    const result = await onStartHandler.handle(ctx);

    expect(result.text).toBe(
      'Welcome to Tab-Bot! I can help you track your medicine expiration dates.'
    );
  });

  it('should return "bot is started" message when user is not new', async () => {
    const result = await onStartHandler.handle(ctx);

    expect(result.text).toContain('You have already started bot');
  });
});
