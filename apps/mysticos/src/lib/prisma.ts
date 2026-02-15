import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const urlCandidates = [
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.NEON_DATABASE_URL,
].filter(Boolean) as string[];

if (!process.env.DATABASE_URL && urlCandidates[0]) {
  process.env.DATABASE_URL = urlCandidates[0];
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_MISSING');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
