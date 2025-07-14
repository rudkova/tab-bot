import prisma from '../../../shared/database/db.ts';
import type { User } from '@prisma/client';
import type { UserInfo } from '../models/UserInfo.ts';

/**
 * Find a user by their Telegram ID
 * @param telegramId The Telegram ID of the user
 * @returns The user if found, null otherwise
 */
export const findUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  return prisma.user.findUnique({
    where: {
      telegramId: BigInt(telegramId),
    },
  });
};

/**
 * Create a new user
 * @param userInfo The user data to create
 * @returns The created user
 */
export const createUserEntity = async (userInfo: UserInfo): Promise<User> => {
  return prisma.user.create({
    data: {
      telegramId: BigInt(userInfo.telegramId),
      chatId: BigInt(userInfo.chatId),
      username: userInfo.username,
      firstName: userInfo.firstName,
    },
  });
};
