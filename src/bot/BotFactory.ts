import { Telegraf } from 'telegraf';
import { UserService } from '../features/user/services/userService.ts';
import { BotRouterService } from './botRouterService.ts';
import { config } from '../configs/config.ts';
import { ConversationStateService } from '../shared/conversation-state/conversationStateService.ts';
import { MedicationService } from '../features/medication/services/medicationService.ts';

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
