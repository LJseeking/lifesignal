import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 简单的 Mock 实现，防止页面在无 DB 时崩溃
const mockPrisma = {
  user: {
    findUnique: async () => null,
    create: async () => ({ id: 'mock-user', deviceId: 'mock-device' }),
    update: async () => ({}),
  },
  energyAccount: {
    findUnique: async () => null,
    create: async () => ({ energyLevel: 50 }),
    update: async () => ({ energyLevel: 50 }),
  },
  dailyResult: {
    findUnique: async () => null,
    create: async () => ({ 
      energyModel: '{}', 
      scenesJSON: '{}',
      aiInsights: '{}' 
    }),
    update: async () => ({}),
    findMany: async () => [],
  },
  charge: {
    create: async () => ({}),
    findMany: async () => [],
    count: async () => 0,
    findFirst: async () => null,
  },
  profile: {
    findUnique: async () => null,
  },
  $connect: async () => {},
  $disconnect: async () => {},
} as unknown as PrismaClient;

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    try {
      // 如果没有配置 DATABASE_URL，直接返回 Mock
      if (!process.env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL not found. Using Mock Prisma Client.');
        return mockPrisma;
      }
      return new PrismaClient({
        log: ['query'],
      });
    } catch (e) {
      console.error('Failed to initialize Prisma Client:', e);
      return mockPrisma;
    }
  })();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
