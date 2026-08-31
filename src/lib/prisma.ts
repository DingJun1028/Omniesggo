// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// ============================================================
// Prisma Client Singleton — Lazy init for Next.js
// src/lib/prisma.ts
// ============================================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
