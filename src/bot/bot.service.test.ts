import { type Context, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import type { Message } from 'telegraf/typings/core/types/typegram';
import type { IUserService } from '../features/user/types/userService.interface';
import { type Medication, type User } from '@prisma/client';
import type { IConversationStateService } from '../shared/conversation-state/conversation-state.service.interface';
import { MedicationValidator } from '../features/medication/validators/medication.validator';
import type { IMedicationService } from '../features/medication/types/medication.service.interface.ts';
import type { IMedicationValidator } from '../features/medication/types/medication.validator.interface.ts';
import type { INotificationService } from '../features/notification/types/notification.service.interface.ts';
import { ConversationState } from '../shared/conversation-state/conversation-state.types.ts';
import type { TextMessageContext } from './types/context.type.ts';
import { config } from '../configs/config.ts';

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
  const USER_ID = 1;
  const MEDICATION_ID = 1;
  const MEDICATION_NAME = 'med-name-test';
  const EXPIRATION_DATE = '3030-01-01';
  const NOTES = 'notes-test';

  let bot: Telegraf;
  let botService: BotService;
  let ctx: Context;
  let medicationValidator: IMedicationValidator;

  let mockUserService: jest.Mocked<IUserService>;
  let mockConversationStateService: jest.Mocked<IConversationStateService>;
  let mockMedicationService: jest.Mocked<IMedicationService>;
  let mockNotificationService: jest.Mocked<INotificationService>;

  beforeEach(async () => {
    bot = new Telegraf('test-fake-token');
    mockUserService = {
      findUserByTelegramId: jest.fn().mockImplementation(() => {
        return generateUser(USER_ID, BigInt(CHAT_ID));
      }),
      createOrGetUser: jest.fn().mockImplementation(() => {
        return generateUser(USER_ID, BigInt(CHAT_ID));
      }),
    };
    mockConversationStateService = {
      getConversationState: jest.fn(),
      setConversationState: jest.fn(),
      clearConversationState: jest.fn(),
    };

    mockMedicationService = {
      createMedication: jest.fn().mockImplementation(() => {
        return generateMedication(
          MEDICATION_ID,
          USER_ID,
          MEDICATION_NAME,
          new Date(EXPIRATION_DATE),
          NOTES
        );
      }),
    };

    mockNotificationService = {
      createNotification: jest.fn(),
      getTodayNotificationsWithMedications: jest.fn(),
    };

    medicationValidator = new MedicationValidator();

    botService = new BotService(
      bot.telegram,
      mockUserService,
      mockConversationStateService,
      mockMedicationService,
      medicationValidator,
      mockNotificationService
    );

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

  describe('onAddMedication', () => {
    it('should set conversation state and ask for medication name when user exists', async () => {
      mockConversationStateService.setConversationState.mockResolvedValue();

      const result = await botService.onAddMedication(ctx);

      expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(CHAT_ID, {
        state: ConversationState.WAITING_FOR_MEDICATION_NAME,
      });
      expect(result.text).toBe('Please enter the name of the medication:');
    });

    it('should return error message when createOrGetUser throws an error', async () => {
      mockUserService.createOrGetUser.mockRejectedValue(new Error('Failed to create or get user'));

      const result = await botService.onAddMedication(ctx);

      expect(result.text).toBe('Sorry, I could not identify you. Please try again later.');
    });
  });

  describe('onText', () => {
    let textCtx: TextMessageContext;

    beforeEach(() => {
      textCtx = {
        ...ctx,
        message: {
          ...ctx.message,
          chat: { id: CHAT_ID, type: 'private' },
          from: { id: CHAT_ID, first_name: 'Test', is_bot: false },
        },
      } as TextMessageContext;
    });

    it('should return "Unknown command" message for no active conversation', async () => {
      mockConversationStateService.getConversationState.mockResolvedValue(undefined);

      const result = await botService.onText(textCtx);

      expect(result?.text).toContain('Unknown command');
    });

    it('should return message to type expiration date after successfully adding medication name', async () => {
      const timestamp = Date.now();
      textCtx.message.text = MEDICATION_NAME;
      const mockConversationState = {
        state: ConversationState.WAITING_FOR_MEDICATION_NAME,
        timestamp,
      };
      mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

      const result = await botService.onText(textCtx);

      expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(CHAT_ID, {
        ...mockConversationState,
        state: ConversationState.WAITING_FOR_EXPIRATION_DATE,
        medicationName: MEDICATION_NAME,
      });
      expect(result.text).toBe('Please enter the expiration date (YYYY-MM-DD):');
    });

    it('should return message to type notes after successfully adding expiration date', async () => {
      textCtx.message.text = EXPIRATION_DATE;
      const timestamp = Date.now();
      const mockConversationState = {
        state: ConversationState.WAITING_FOR_EXPIRATION_DATE,
        medicationName: MEDICATION_NAME,
        timestamp,
      };
      mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

      const result = await botService.onText(textCtx);

      expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(CHAT_ID, {
        ...mockConversationState,
        state: ConversationState.WAITING_FOR_NOTES,
        expirationDate: new Date(EXPIRATION_DATE),
      });
      expect(result.text).toBe(
        'Please enter any notes about the medication (or type "-" if there are no notes):'
      );
    });

    it('should return error message when expiration date is invalid', async () => {
      textCtx.message.text = 'invalid_date';
      const timestamp = Date.now();
      const mockConversationState = {
        state: ConversationState.WAITING_FOR_EXPIRATION_DATE,
        medicationName: MEDICATION_NAME,
        timestamp,
      };
      mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

      const result = await botService.onText(textCtx);

      expect(result.text).toBe(
        `Invalid date format. Please enter the date in ${config.app.dateFormat.toUpperCase()} format:`
      );
    });

    it('should return success message after successfully adding notes and saving medication', async () => {
      textCtx.message.text = NOTES;
      const timestamp = Date.now();
      const mockConversationState = {
        state: ConversationState.WAITING_FOR_NOTES,
        medicationName: MEDICATION_NAME,
        expirationDate: new Date(EXPIRATION_DATE),
        timestamp,
      };
      mockConversationStateService.getConversationState.mockResolvedValue(mockConversationState);

      const result = await botService.onText(textCtx);

      expect(mockConversationStateService.setConversationState).toHaveBeenCalledWith(CHAT_ID, {
        ...mockConversationState,
        state: ConversationState.IDLE,
        notes: NOTES,
      });
      expect(mockMedicationService.createMedication).toHaveBeenCalled();
      expect(mockNotificationService.createNotification).toHaveBeenCalled();
      expect(mockConversationStateService.clearConversationState).toHaveBeenCalled();
      expect(result.text).toBe(`Medication "${MEDICATION_NAME}" has been added successfully!`);
    });

    it('should return "Unknown command" message for no active conversation on save medication', async () => {
      textCtx.message.text = NOTES;
      const timestamp = Date.now();
      const mockConversationState = {
        state: ConversationState.WAITING_FOR_NOTES,
        medicationName: MEDICATION_NAME,
        expirationDate: new Date(EXPIRATION_DATE),
        timestamp,
      };
      mockConversationStateService.getConversationState
        .mockResolvedValueOnce(mockConversationState)
        .mockResolvedValueOnce(undefined);

      const result = await botService.onText(textCtx);

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
      // const result = await botService.onText(textCtx);
      //
      // expect(conversationStateService.clearConversationState).toHaveBeenCalledWith(CHAT_ID);
      // expect(result?.text).toContain('Sorry, something went wrong');
    });

    // todo add tests with specific errors checking
  });

  describe('onStart', () => {
    it('should return welcome message when user is new', async () => {
      mockUserService.findUserByTelegramId.mockResolvedValue(null);

      const result = await botService.onStart(ctx);

      expect(result.text).toBe(
        'Welcome to Tab-Bot! I can help you track your medicine expiration dates.'
      );
    });

    it('should return "bot is started" message when user is not new', async () => {
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
      const result = await botService.onAddMedication(ctx);

      expect(result.text).toBe('Please enter the name of the medication:');
    });
  });

  describe('onCancelAddMedication', () => {
    it('should clear conversation state and return a cancellation message', async () => {
      mockConversationStateService.clearConversationState.mockResolvedValue(undefined);

      const result = await botService.onCancelAddMedication(ctx);

      // Verify the correct message is returned
      expect(result.text).toBe('Adding medication has been cancelled.');
    });
  });
});

const generateUser = (userId: number, chatId: bigint): User => ({
  id: userId,
  telegramId: 1n,
  chatId,
  username: 'test-username',
  firstName: 'test-firstName',
  timezone: 'test-tz',
  createdAt: new Date(),
  updatedAt: null,
});

const generateMedication = (
  medicationId: number,
  userId: number,
  name: string,
  expirationDate: Date,
  notes: string
): Medication => ({
  id: medicationId,
  userId,
  name,
  expirationDate,
  notes,
  createdAt: new Date(),
  updatedAt: null,
});
