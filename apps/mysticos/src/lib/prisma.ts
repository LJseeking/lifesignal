import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Safe initialization to prevent crash if DATABASE_URL is missing
const createPrismaClient = () => {
  try {
    return new PrismaClient();
  } catch (e) {
    console.error("CRITICAL: Failed to initialize Prisma Client. Missing DATABASE_URL?", e);
    // Return a Proxy that allows the app to boot but fails on query
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$connect' || prop === '$disconnect') return async () => {};
        // If accessing a model (e.g. prisma.user), return a mock object with findUnique etc.
        return new Proxy({}, {
          get: (modelTarget, modelProp) => {
            return async () => {
              throw new Error(`Database not available. Action: ${String(prop)}.${String(modelProp)}`);
            };
          }
        });
      }
    });
  }
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
