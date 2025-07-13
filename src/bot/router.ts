// Command routing file
// This file contains the logic for routing commands to their respective handlers
import { Telegraf } from 'telegraf';

/**
 * Sets up command handlers for the bot
 * @param bot The Telegraf bot instance
 */
export function setupCommands(bot: Telegraf) {
  // Start command
  bot.start(ctx => {
    return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
  });

  // Help command
  bot.help(ctx => {
    return ctx.reply(
      'I can help you track your medicine expiration dates.\n\n' +
        'Available commands:\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message'
    );
  });

  // Echo for testing
  bot.on('text', ctx => {
    return ctx.reply(`You said: ${ctx.message.text}`);
  });
}
