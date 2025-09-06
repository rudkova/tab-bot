import { Prisma } from '@prisma/client';

export type NotificationWithMedication = Omit<
  Prisma.NotificationGetPayload<{ include: { medication: true } }>,
  'chatId'
> & {
  chatId: number; // Override the BigInt chatId with number
};
