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

const missingEnvPrisma = new Proxy(
  {},
  {
    get() {
      throw new Error('DATABASE_URL_MISSING');
    },
  }
) as unknown as PrismaClient;

export const prisma =
  process.env.DATABASE_URL
    ? globalForPrisma.prisma ?? new PrismaClient()
    : missingEnvPrisma;

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
}
