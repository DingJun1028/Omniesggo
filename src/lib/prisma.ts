import { PrismaClient } from '@prisma/client';

// Global Prisma singleton to prevent multiple instances in hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
