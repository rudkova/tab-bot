import type { BotContext } from '../types/context.type.ts';
import { BotService } from '../bot.service.ts';
import { DEFAULT_TEST_CHAT_ID } from '../../__test-utils__/generator.ts';
import { OnHelpHandler } from './on-help.handler.ts';
import type { INotificationService } from '../../features/notification/types/notification.service.interface.ts';
import { testBot } from '../../jest.setup.ts';

describe('onHelp', () => {
  let ctx: BotContext;
  let botService: BotService;
  let onHelpHandler: OnHelpHandler;

  let mockNotificationService: jest.Mocked<INotificationService>;

  beforeEach(() => {
    ctx = {
      chat: { id: DEFAULT_TEST_CHAT_ID },
      from: { id: DEFAULT_TEST_CHAT_ID },
      reply: async (text: string) => testBot.telegram.sendMessage(DEFAULT_TEST_CHAT_ID, text),
    } as BotContext;

    mockNotificationService = {
      createNotification: jest.fn(),
      getTodayNotificationsWithMedications: jest.fn(),
    };

    botService = new BotService(testBot.telegram, mockNotificationService);
    onHelpHandler = new OnHelpHandler(botService);
  });

  it('should return a list of available commands', async () => {
    const result = await onHelpHandler.handle(ctx);
    expect(result.text).toContain('Available commands:'); // todo add precise message when extract commands
  });
});
