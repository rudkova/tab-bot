import type { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository.ts';
import type { TelegramUserInfo } from '../../../bot/types/user-info.model.ts';
import logger from '../../../shared/logger/logger.ts';
import type { IUserService } from '../types/IUserService.ts';

export class UserService implements IUserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Creates a user if it doesn't exist
   * @param userInfo
   * @returns The user (either existing or newly created)
   */
  async createOrGetUser(userInfo: TelegramUserInfo): Promise<User> {
    const { telegramId, chatId, username, firstName } = userInfo;
    const user = await this.userRepository.findUserByTelegramId(telegramId);

    if (user) {
      return user;
    }

    try {
      logger.info('Try to create user.', {
        telegramId,
        chatId,
        username,
        firstName,
      });
      const createdUser = await this.userRepository.createUserEntity(userInfo);
      logger.debug('User is created.', { id: createdUser.id });
      return createdUser;
    } catch (e) {
      if (e instanceof Error) {
        logger.error('Failed to create user.', {
          userInfo,
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error('Failed to create user.', {
          userInfo,
          error: String(e),
        });
      }
      throw e;
    }
  }

  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    try {
      return this.userRepository.findUserByTelegramId(telegramId);
    } catch (e) {
      if (e instanceof Error) {
        logger.error('Failed to find user.', {
          telegramId,
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error('Failed to find user.', {
          telegramId,
          error: String(e),
        });
      }
      throw e;
    }
  }
}
