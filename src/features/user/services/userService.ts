import type { User } from '@prisma/client';
import { Context } from 'telegraf';
import { UserRepository } from '../repositories/userRepository.ts';
import type { UserInfo } from '../models/UserInfo.ts';

export class UserService {
  constructor(private readonly userRepository: UserRepository = new UserRepository()) {}

  /**
   * Creates a user if it doesn't exist
   * @param userInfo
   * @returns The user (either existing or newly created)
   */
  async createOrGetUser(userInfo: UserInfo): Promise<User> {
    const user = await this.userRepository.findUserByTelegramId(userInfo.telegramId);

    if (user) {
      return user;
    }

    return this.userRepository.createUserEntity(userInfo);
  }

  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.userRepository.findUserByTelegramId(telegramId);
  }
  /**
   * Extracts user information from the Telegraf context
   * @param ctx The Telegraf context
   * @param chatId
   * @returns User information
   */
  getUserInfo(ctx: Context, chatId: number): UserInfo {
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
  }
}
