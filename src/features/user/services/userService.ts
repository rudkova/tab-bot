import type { User } from '@prisma/client';
import { Context } from 'telegraf';
import { findUserByTelegramId, createUserEntity } from '../repositories/userRepository.ts';
import type { UserInfo } from '../models/UserInfo.ts';

/**
 * Creates a user if it doesn't exist
 * @param userInfo
 * @returns The user (either existing or newly created)
 */
const createOrGetUser = async (userInfo: UserInfo): Promise<User> => {
  const user = await findUserByTelegramId(userInfo.telegramId);

  if (user) {
    return user;
  }

  return createUserEntity(userInfo);
};

/**
 * Extracts user information from the Telegraf context
 * @param ctx The Telegraf context
 * @param chatId
 * @returns User information
 */
const getUserInfo = (ctx: Context, chatId: number): UserInfo => {
  if (!ctx.from) {
    throw new Error(`No user information in context. ${JSON.stringify(ctx, null, 2)}`);
  }
  if (chatId == null) {
    throw new Error(`No chatId for user: ${ctx.from.id}`);
  }

  return {
    chatId,
    telegramId: ctx.from.id,
    username: ctx.from.username,
    firstName: ctx.from.first_name,
  };
};
export { createOrGetUser, getUserInfo };
