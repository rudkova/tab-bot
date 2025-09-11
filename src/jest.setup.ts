import { Telegraf } from 'telegraf';
import { DEFAULT_TEST_FAKE_TOKEN } from './__test-utils__/generator.ts';

jest.mock('./configs/config.ts', () => ({
  config: {
    bot: { token: 'test-token' },
    app: {
      env: 'test',
      dateFormat: 'yyyy-MM-dd',
      defaultTZ: 'UTC',
      logLevel: 'info',
    },
    database: { url: 'file:./test.db' },
  },
}));

const testBot = new Telegraf(DEFAULT_TEST_FAKE_TOKEN);

//    // Intercept all outgoing Telegram messages

// Mock Telegraf's sendMessage by default
const mockSendMessage = jest.fn().mockImplementation((chatId, text) => ({
  message_id: Math.floor(Math.random() * 1000),
  chat: { id: chatId },
  text,
}));

testBot.telegram.sendMessage = mockSendMessage;
//
// // Mock Telegraf's methods
// const mockTelegram = {
//   sendMessage: mockSendMessage,
//   // Add other methods you want to mock by default
// };
//
//
// // Export the mock methods so they can be modified in individual tests
// export const mockTelegramMethods = {
//   sendMessage: mockSendMessage,
//   // Add other methods here as needed
// };
//
// // Reset all mocks before each test
// // beforeEach(() => {
// //   // Clear all mocks
// //   jest.clearAllMocks();
// //
// //   // Reset the default implementation of sendMessage
// //   mockSendMessage.mockImplementation((chatId, text) => ({
// //     message_id: Math.floor(Math.random() * 1000),
// //     chat: { id: chatId },
// //     text,
// //   }));
// // });

export { testBot };
