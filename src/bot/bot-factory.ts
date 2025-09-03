import { config } from '../configs/config.ts';
import prisma from '../shared/database/db.ts';
import logger from '../shared/logger/logger.ts';
import { Telegraf } from 'telegraf';
import { UserService } from '../features/user/services/user.service.ts';
import { BotRouterService } from './bot-router.service.ts';
import { ConversationStateService } from '../shared/conversation-state/conversation-state.service.ts';
import { MedicationService } from '../features/medication/services/medication.service.ts';
import { MedicationValidator } from '../features/medication/validators/medication.validator.ts';
import { UserRepository } from '../features/user/repositories/user.repository.ts';
import { InMemoryConversationStateStore } from '../shared/conversation-state/in-memory-conversation-state-store.service.ts';
import { MedicationRepository } from '../features/medication/repositories/medication.repository.ts';
import { NotificationService } from '../features/notification/services/notification.service.ts';
import { NotificationCron } from '../jobs/notification-cron.ts';
import { NotificationRepository } from '../features/notification/services/notification.repository.ts';
import { BotService } from './bot.service.ts';

export async function createBot(): Promise<Telegraf> {
  logger.info('Try to create bot');
  const bot = new Telegraf(config.bot.token);

  // Create repositories
  const userRepository = new UserRepository(prisma);
  const medicationRepository = new MedicationRepository(prisma);
  const notificationRepository = new NotificationRepository(prisma);

  // Create services
  const userService = new UserService(userRepository);
  const botService = new BotService(bot.telegram, userService);
  const medicationService = new MedicationService(medicationRepository);
  const medicationValidator = new MedicationValidator();
  const notificationService = new NotificationService(notificationRepository, botService);
  const notificationCron = new NotificationCron(notificationService);

  const store = new InMemoryConversationStateStore();
  const conversationStateService = new ConversationStateService(store);

  const router = new BotRouterService(
    botService,
    userService,
    conversationStateService,
    medicationService,
    medicationValidator,
    notificationService
  );

  await router.setupCommands(bot);

  logger.info('Bot is created');

  notificationCron.start();

  return bot;
}
