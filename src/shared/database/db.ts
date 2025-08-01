import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0); // Add this to ensure process dies
};

process.on('SIGTERM', shutdown); // For Node.js --watch
process.on('SIGINT', shutdown); // For Ctrl+C
process.on('beforeExit', shutdown); // For normal exit
