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
import { InMemoryConversationStateStoreService } from '../shared/conversation-state/in-memory-conversation-state-store.service.ts';
import { MedicationRepository } from '../features/medication/repositories/medication.repository.ts';
import { NotificationService } from '../features/notification/services/notification.service.ts';
import { NotificationCron } from '../jobs/notification-cron.ts';
import { NotificationRepository } from '../features/notification/services/notification.repository.ts';
import { BotService } from './bot.service.ts';
import { OnStartHandler } from './handlers/on-start.handler.ts';
import { OnHelpHandler } from './handlers/on-help.handler.ts';
import { AddMedicationHandler } from './handlers/add-medication.handler.ts';
import { AddMedicationTextHandler } from './handlers/add-medication-text-handler.ts';
import { OnCancelHandler } from './handlers/on-cancel.handler.ts';
import { AcceptNotificationHandler } from './handlers/accept-notification.handler.ts';
import { SkipNotificationHandler } from './handlers/skip-notification.handler.ts';

export async function createBot(): Promise<Telegraf> {
  logger.info('Try to create bot');
  const bot = new Telegraf(config.bot.token);

  // Create repositories
  const userRepository = new UserRepository(prisma);
  const medicationRepository = new MedicationRepository(prisma);
  const notificationRepository = new NotificationRepository(prisma);

  // Create services
  const store = new InMemoryConversationStateStoreService();
  const conversationStateService = new ConversationStateService(store);

  const userService = new UserService(userRepository);
  const medicationService = new MedicationService(medicationRepository);
  const medicationValidator = new MedicationValidator();
  const notificationService = new NotificationService(notificationRepository);

  const botService = new BotService(bot.telegram, notificationService);

  // Create handlers
  const onStartHandler = new OnStartHandler(botService, userService);
  const onHelpHandler = new OnHelpHandler(botService);
  const addMedicationHandler = new AddMedicationHandler(
    botService,
    conversationStateService,
    userService
  );
  const addMedicationTextHandler = new AddMedicationTextHandler(
    botService,
    conversationStateService,
    userService,
    medicationService,
    medicationValidator,
    notificationService
  );
  const onCancelHandler = new OnCancelHandler(botService, conversationStateService);
  const acceptNotificationHandler = new AcceptNotificationHandler(botService, medicationService);
  const skipNotificationHandler = new SkipNotificationHandler(botService, userService);

  const router = new BotRouterService(
    onStartHandler,
    onHelpHandler,
    addMedicationHandler,
    addMedicationTextHandler,
    onCancelHandler,
    acceptNotificationHandler,
    skipNotificationHandler
  );

  const notificationCron = new NotificationCron(botService);

  // Setup bot commands and handlers
  await router.setupCommands(bot);

  logger.info('Bot is created');

  notificationCron.start();

  return bot;
}
