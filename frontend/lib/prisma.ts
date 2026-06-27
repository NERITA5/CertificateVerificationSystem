import { PrismaClient } from '@prisma/client';

// 1. Debugging: Confirm that the file is even being loaded
console.log("DEBUG: prisma.ts file is being initialized.");

// 2. Debugging: Verify if the environment variable exists and what it looks like
const dbUrl = process.env.DATABASE_URL;
console.log("DEBUG: Is DATABASE_URL defined?", !!dbUrl);
console.log("DEBUG: Initializing Prisma Client with URL:", dbUrl?.substring(0, 30) + "...");

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 3. Initialize Prisma Client
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // This will show you exactly what SQL is being executed
  });

// 4. Handle global instance for development hot-reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 5. Debugging: Confirm completion
console.log("DEBUG: Prisma Client initialization block finished.");