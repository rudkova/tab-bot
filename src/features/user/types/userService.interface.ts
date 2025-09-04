import type { TelegramUserInfo } from '../../../bot/types/user-info.model.ts';
import type { User } from '@prisma/client';

export interface IUserService {
  createOrGetUser(userInfo: TelegramUserInfo): Promise<User>;
  findUserByTelegramId(telegramId: number): Promise<User | null>;
}
