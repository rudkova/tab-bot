import type { PrismaClient, User } from '@prisma/client';
import type { UserInfo } from '../models/user-info.model.ts';

export class UserRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  /**
   * Find a user by their Telegram ID
   * @param telegramId The Telegram ID of the user
   * @returns The user if found, null otherwise
   */
  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.prismaClient.user.findUnique({
      where: {
        telegramId: BigInt(telegramId),
      },
    });
  }

  /**
   * Create a new user
   * @param userInfo The user data to create
   * @returns The created user
   */
  async createUserEntity(userInfo: UserInfo): Promise<User> {
    return this.prismaClient.user.create({
      data: {
        telegramId: BigInt(userInfo.telegramId),
        chatId: BigInt(userInfo.chatId),
        username: userInfo.username,
        firstName: userInfo.firstName,
      },
    });
  }
}
