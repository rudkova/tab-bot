import { Telegraf } from 'telegraf';
import { createOrGetUser, getUserInfo } from '../features/user/services/userService.ts';

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

  // todo personalized welcome message
  bot.start(ctx => {
    console.log(`${JSON.stringify(ctx.from, null, 2)}`);
    return ctx.reply('Welcome to Tab-Bot! I can help you track your medicine expiration dates.');
  });

  bot.help(ctx => {
    return ctx.reply(HELP_DESCRIPTION);
  });

  bot.command('add_medication', async ctx => {
    const userInfo = getUserInfo(ctx, ctx.chat.id);

    try {
      const user = await createOrGetUser(userInfo);
      console.log(
        `User created or found. telegramId=${user.telegramId}, chatId=${user.chatId}, username=${user.username}`
      );
      return ctx.reply(
        'Please provide details about the medication you want to add (name, expiration date, etc.)'
      );
    } catch (e) {
      // todo add error message
      console.error('Could not create or get user', e);
      return ctx.reply('Sorry, I could not identify you. Please try again later.');
    }

    // ask user medication name
    // ask user expiration date
    // ask user note
    // save medication
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
