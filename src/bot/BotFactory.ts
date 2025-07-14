import { Telegraf } from 'telegraf';
import { UserService } from '../features/user/services/userService.ts';
import { BotRouterService } from './botRouterService.ts';
import { config } from '../configs/config.ts';

export async function createBot(): Promise<Telegraf> {
  const bot = new Telegraf(config.bot.token);

  // Create services
  const userService = new UserService();

  const router = new BotRouterService(userService);

  await router.setupCommands(bot);

  return bot;
}
