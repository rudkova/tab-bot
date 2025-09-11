import type { TextMessageContext } from '../types/context.type.ts';
import {
  DEFAULT_TEST_CHAT_ID,
  DEFAULT_TEST_EXPIRATION_DATE_STRING,
  DEFAULT_TEST_MEDICATION_ID,
  DEFAULT_TEST_MEDICATION_NAME,
  DEFAULT_TEST_NOTES,
  DEFAULT_TEST_USER_ID,
  generateMedication,
  generateUser,
} from '../../__test-utils__/generator.ts';
import type { IMedicationValidator } from '../../features/medication/types/medication.validator.interface.ts';
import type { IUserService } from '../../features/user/types/userService.interface.ts';
import type { IConversationStateService } from '../../shared/conversation-state/conversation-state.service.interface.ts';
import type { IMedicationService } from '../../features/medication/types/medication.service.interface.ts';
import type { INotificationService } from '../../features/notification/types/notification.service.interface.ts';
import { AddMedicationTextHandler } from './add-medication-text-handler.ts';
import { ConversationState } from '../../shared/conversation-state/conversation-state.types.ts';
import { config } from '../../configs/config.ts';
import { BotService } from '../bot.service.ts';
import { MedicationValidator } from '../../features/medication/validators/medication.validator.ts';
import { testBot } from '../../jest.setup.ts';

describe('Add medication. TextHandler', () => {
  let ctx: TextMessageContext;
  let medicationValidator: IMedicationValidator;

  let botService: BotService;
  let mockUserService: jest.Mocked<IUserService>;
  let mockConversationStateService: jest.Mocked<IConversationStateService>;
  let mockMedicationService: jest.Mocked<IMedicationService>;
  let mockNotificationService: jest.Mocked<INotificationService>;

  let addMedicationTextHandler: AddMedicationTextHandler;

  beforeEach(() => {
    botService = new BotService(testBot.telegram, mockNotificationService);
    medicationValidator = new MedicationValidator();

    ctx = {
      chat: { id: DEFAULT_TEST_CHAT_ID },
      from: { id: DEFAULT_TEST_CHAT_ID },
      reply: async (text: string) => testBot.telegram.sendMessage(DEFAULT_TEST_CHAT_ID, text),
      message: {
        chat: { id: DEFAULT_TEST_CHAT_ID, type: 'private' },
        from: { id: DEFAULT_TEST_CHAT_ID, first_name: 'Test', is_bot: false },
      },
    } as TextMessageContext;
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
    mockMedicationService = {
      createMedication: jest.fn().mockImplementation(() => {
        return generateMedication(
          DEFAULT_TEST_MEDICATION_ID,
          DEFAULT_TEST_USER_ID,
          DEFAULT_TEST_MEDICATION_NAME,
          new Date(DEFAULT_TEST_EXPIRATION_DATE_STRING),
          DEFAULT_TEST_NOTES
        );
      }),
    };

    mockNotificationService = {
      createNotification: jest.fn(),
      getTodayNotificationsWithMedications: jest.fn(),
    };
    addMedicationTextHandler = new AddMedicationTextHandler(
      botService,
      mockConversationStateService,
      mockUserService,
      mockMedicationService,
      medicationValidator,
      mockNotificationService
    );
  });

  it('should return "Unknown command" message for no active conversation', async () => {
    mockConversationStateService.getConversationState.mockResolvedValue(undefined);

    const result = await addMedicationTextHandler.handle(ctx);

    expect(result?.text).toContain('Unknown command');
  });

  it('should return message to type expiration date after successfully adding medication name', async () => {
    const timestamp = Date.now();
    ctx.message.text = DEFAULT_TEST_MEDICATION_NAME;
    const mockConversationState = {
      state: ConversationState.WAITING_FOR_MEDICATION_NAME,
      timestamp,
    };
    mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

    const result = await addMedicationTextHandler.handle(ctx);

    expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(
      DEFAULT_TEST_CHAT_ID,
      {
        ...mockConversationState,
        state: ConversationState.WAITING_FOR_EXPIRATION_DATE,
        medicationName: DEFAULT_TEST_MEDICATION_NAME,
      }
    );
    expect(result.text).toBe('Please enter the expiration date (YYYY-MM-DD):');
  });

  it('should return message to type notes after successfully adding expiration date', async () => {
    ctx.message.text = DEFAULT_TEST_EXPIRATION_DATE_STRING;
    const timestamp = Date.now();
    const mockConversationState = {
      state: ConversationState.WAITING_FOR_EXPIRATION_DATE,
      medicationName: DEFAULT_TEST_MEDICATION_NAME,
      timestamp,
    };
    mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

    const result = await addMedicationTextHandler.handle(ctx);

    expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(
      DEFAULT_TEST_CHAT_ID,
      {
        ...mockConversationState,
        state: ConversationState.WAITING_FOR_NOTES,
        expirationDate: new Date(DEFAULT_TEST_EXPIRATION_DATE_STRING),
      }
    );
    expect(result.text).toBe(
      'Please enter any notes about the medication (or type "-" if there are no notes):'
    );
  });

  it('should return error message when expiration date is invalid', async () => {
    ctx.message.text = 'invalid_date';
    const timestamp = Date.now();
    const mockConversationState = {
      state: ConversationState.WAITING_FOR_EXPIRATION_DATE,
      medicationName: DEFAULT_TEST_MEDICATION_NAME,
      timestamp,
    };
    mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

    const result = await addMedicationTextHandler.handle(ctx);

    expect(result.text).toBe(
      `Invalid date format. Please enter the date in ${config.app.dateFormat.toUpperCase()} format:`
    );
  });

  it('should return success message after successfully adding notes and saving medication', async () => {
    ctx.message.text = DEFAULT_TEST_NOTES;
    const timestamp = Date.now();
    const mockConversationState = {
      state: ConversationState.WAITING_FOR_NOTES,
      medicationName: DEFAULT_TEST_MEDICATION_NAME,
      expirationDate: new Date(DEFAULT_TEST_EXPIRATION_DATE_STRING),
      timestamp,
    };
    mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

    const result = await addMedicationTextHandler.handle(ctx);

    expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(
      DEFAULT_TEST_CHAT_ID,
      {
        ...mockConversationState,
        state: ConversationState.IDLE,
        notes: DEFAULT_TEST_NOTES,
      }
    );
    expect(mockMedicationService.createMedication).toHaveBeenCalled();
    expect(mockNotificationService.createNotification).toHaveBeenCalled();
    expect(mockConversationStateService.clearConversationState).toHaveBeenCalled();
    expect(result.text).toBe(
      `Medication "${DEFAULT_TEST_MEDICATION_NAME}" has been added successfully!`
    );
  });

  it('should return "Unknown command" message for no active conversation on save medication', async () => {
    ctx.message.text = DEFAULT_TEST_NOTES;
    const timestamp = Date.now();
    const mockConversationState = {
      state: ConversationState.WAITING_FOR_NOTES,
      medicationName: DEFAULT_TEST_MEDICATION_NAME,
      expirationDate: new Date(DEFAULT_TEST_EXPIRATION_DATE_STRING),
      timestamp,
    };
    mockConversationStateService.getConversationState
      .mockResolvedValueOnce(mockConversationState)
      .mockResolvedValueOnce(undefined);

    const result = await addMedicationTextHandler.handle(ctx);

    expect(mockConversationStateService.getConversationState).toHaveBeenCalledTimes(2);
    expect(result?.text).toBe('Sorry, something went wrong. Please try again.');
  });

  it('should handle unknown state by clearing conversation and showing error', async () => {
    // const mockConversation = {
    //   state: 'UNKNOWN_STATE' as never,
    //   data: {},
    // };
    // conversationStateService.getConversationState.mockResolvedValue(mockConversation);
    // conversationStateService.clearConversationState.mockResolvedValue();
    //
    // const result = await addMedicationTextHandler.handle(textCtx);
    //
    // expect(conversationStateService.clearConversationState).toHaveBeenCalledWith(DEFAULT_TEST_CHAT_ID);
    // expect(result?.text).toContain('Sorry, something went wrong');
  });

  // todo add tests with specific errors checking
});
