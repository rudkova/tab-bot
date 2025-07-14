import { createBot } from './bot/BotFactory.ts';

const bot = await createBot();

bot
  .launch()
  .then(() => {
    console.log('Bot started successfully');
  })
  .catch(err => {
    console.error('Error starting bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
