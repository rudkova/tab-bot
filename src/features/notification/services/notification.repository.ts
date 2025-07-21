import type { PrismaClient } from '@prisma/client';

export class NotificationRepository {
  constructor(private readonly prismaClient: PrismaClient) {}
}
