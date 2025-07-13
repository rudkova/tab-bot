// Bot initialization file
// This file contains the code to initialize and configure the bot
import { Telegraf } from 'telegraf';
import { config } from '../configs/config';

// Create bot instance
const bot = new Telegraf(config.bot.token);

export default bot;
