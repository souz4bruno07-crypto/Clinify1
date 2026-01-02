import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// IMPORTANTE: Configure o pool de conexões na sua DATABASE_URL no .env:
// postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=10
// Isso permite múltiplas conexões simultâneas e melhora a performance

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;










