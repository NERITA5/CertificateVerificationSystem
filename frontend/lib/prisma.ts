import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Log the connection to verify
console.log("Initializing Prisma Client with URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // This will show you exactly what SQL is being executed
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma