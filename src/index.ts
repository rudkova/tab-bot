import { config } from './configs/config.ts';
import logger from './shared/logger/logger.ts';
import { createBot } from './bot/bot-factory.ts';

if (config.app.env !== 'prod') {
  logger.info(`Env params ${JSON.stringify(config, null, 2)}`);
}

const bot = await createBot();
await bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
