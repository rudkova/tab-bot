import type { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository.ts';
import type { TelegramUserInfo } from '../../../bot/types/user-info.model.ts';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Creates a user if it doesn't exist
   * @param userInfo
   * @returns The user (either existing or newly created)
   */
  async createOrGetUser(userInfo: TelegramUserInfo): Promise<User> {
    const user = await this.userRepository.findUserByTelegramId(userInfo.telegramId);

    if (user) {
      return user;
    }

    return this.userRepository.createUserEntity(userInfo);
  }

  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.userRepository.findUserByTelegramId(telegramId);
  }
}
