import { Telegraf } from 'telegraf';
import { UserService } from '../features/user/services/user.service.ts';
import { BotRouterService } from './bot-router.service.ts';
import { config } from '../configs/config.ts';
import { ConversationStateService } from '../shared/conversation-state/conversation-state.service.ts';
import { MedicationService } from '../features/medication/services/medication.service.ts';

export async function createBot(): Promise<Telegraf> {
  const bot = new Telegraf(config.bot.token);

  // Create services
  const userService = new UserService();
  const conversationStateService = new ConversationStateService();
  const medicationService = new MedicationService();

  const router = new BotRouterService(userService, conversationStateService, medicationService);

  await router.setupCommands(bot);

  return bot;
}
