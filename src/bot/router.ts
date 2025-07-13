import { Telegraf } from 'telegraf';

/**
 * Sets up command handlers for the bot
 * @param bot The Telegraf bot instance
 */
export function setupCommands(bot: Telegraf) {
  // Set up the bot commands menu
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Show help message' },
    { command: 'add_medication', description: 'Add a new medication' },
    { command: 'contact_developer', description: 'Contact the developer' },
  ]);

  bot.start(ctx => {
    return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
  });

  bot.help(ctx => {
    return ctx.reply(
      'I can help you track your medicine expiration dates.\n\n' +
        'Available commands:\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/add_medication - Add a new medication\n' +
        '/contact_developer - Contact the developer'
    );
  });

  // Add medication command
  bot.command('add_medication', ctx => {
    return ctx.reply(
      'Please provide details about the medication you want to add (name, expiration date, etc.)'
    );
  });

  // Write to developer command
  bot.command('contact_developer', ctx => {
    return ctx.reply(
      'If you have any questions or suggestions, please write them here and they will be forwarded to the developer.'
    );
  });

  // Echo for testing
  bot.on('text', ctx => {
    return ctx.reply(`You said: ${ctx.message.text}`);
  });
}
