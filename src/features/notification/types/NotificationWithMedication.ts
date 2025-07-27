import { Prisma } from '@prisma/client';
//
// export type NotificationWithMedication = Prisma.NotificationGetPayload<{
//   include: { medication: true };
// }> & {
//   chatId: number; // Override the BigInt chatId with number
// };

export type NotificationWithMedication = Omit<
  Prisma.NotificationGetPayload<{ include: { medication: true } }>,
  'chatId'
> & {
  chatId: number; // Override the BigInt chatId with number
};
// Prisma.NotificationGetPayload<{
//   include: { medication: true };
// }>,
// 'chatId'
// > & {
//   chatId: number;
// };
