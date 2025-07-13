/**
 * Tab-Bot - A Telegram bot for medicine expiration reminders
 */
import bot from './bot/bot.js';
import { setupCommands } from './bot/router.js';

setupCommands(bot);

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
