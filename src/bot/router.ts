import { Telegraf } from 'telegraf';

const commands = [
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help message' },
  { command: 'add_medication', description: 'Add a new medication' },
  { command: 'contact_developer', description: 'Contact the developer' },
];

const HELP_DESCRIPTION =
  'I can help you track your medicine expiration dates.\n\n' +
  'Available commands:\n' +
  `${commands.map(c => `/${c.command} - ${c.description}`).join('\n')}`;

/**
 * Sets up command handlers for the bot
 * @param bot The Telegraf bot instance
 */
const setupCommands = async (bot: Telegraf) => {
  await bot.telegram.setMyCommands(commands);

  bot.start(ctx => {
    return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
  });

  bot.help(ctx => {
    return ctx.reply(HELP_DESCRIPTION);
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
};

export { setupCommands };
