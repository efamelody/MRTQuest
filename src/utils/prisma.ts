import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
    // Configure connection pooling for development/edge environments
    ...(process.env.NODE_ENV === 'development' && {
      errorFormat: 'pretty',
    }),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  
  // Clean up on hot reload in development
  if (process.env.NODE_ENV === 'development') {
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
}
