import {
  DEFAULT_TEST_CHAT_ID,
  DEFAULT_TEST_USER_ID,
  generateUser,
} from '../../__test-utils__/generator.ts';
import { BotService } from '../bot.service.ts';
import type { BotContext } from '../types/context.type.ts';
import type { IUserService } from '../../features/user/types/userService.interface.ts';
import type { IConversationStateService } from '../../shared/conversation-state/conversation-state.service.interface.ts';
import { AddMedicationHandler } from './add-medication.handler';
import { ConversationState } from '../../shared/conversation-state/conversation-state.types.ts';
import type { INotificationService } from '../../features/notification/types/notification.service.interface.ts';
import { testBot } from '../../jest.setup.ts';

describe('onAddMedication', () => {
  let ctx: BotContext;
  let botService: BotService;
  let addMedicationHandler: AddMedicationHandler;

  let mockUserService: jest.Mocked<IUserService>;
  let mockConversationStateService: jest.Mocked<IConversationStateService>;
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

    mockConversationStateService = {
      getConversationState: jest.fn(),
      setConversationState: jest.fn(),
      clearConversationState: jest.fn(),
    };
    mockUserService = {
      findUserByTelegramId: jest.fn().mockImplementation(() => {
        return generateUser(DEFAULT_TEST_USER_ID, BigInt(DEFAULT_TEST_CHAT_ID));
      }),
      createOrGetUser: jest.fn().mockImplementation(() => {
        return generateUser(DEFAULT_TEST_USER_ID, BigInt(DEFAULT_TEST_CHAT_ID));
      }),
    };

    botService = new BotService(testBot.telegram, mockNotificationService);
    addMedicationHandler = new AddMedicationHandler(
      botService,
      mockConversationStateService,
      mockUserService
    );
  });

  it('should set conversation state and ask for medication name when user exists', async () => {
    mockConversationStateService.setConversationState.mockResolvedValue();

    const result = await addMedicationHandler.handle(ctx);

    expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(
      DEFAULT_TEST_CHAT_ID,
      {
        state: ConversationState.WAITING_FOR_MEDICATION_NAME,
      }
    );
    expect(result.text).toBe('Please enter the name of the medication:');
  });

  it('should return error message when createOrGetUser throws an error', async () => {
    mockUserService.createOrGetUser.mockRejectedValue(new Error('Failed to create or get user'));

    const result = await addMedicationHandler.handle(ctx);

    expect(result.text).toBe('Sorry, I could not identify you. Please try again later.');
  });
});
