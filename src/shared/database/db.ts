import { PrismaClient } from '@prisma/client';
import logger from '../logger/logger.ts';

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('Disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown); // For Node.js --watch
process.on('SIGINT', shutdown); // For Ctrl+C
process.on('beforeExit', shutdown); // For normal exit
