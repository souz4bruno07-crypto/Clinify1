import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from './logger.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Configuração do Prisma Client com SSL e connection pooling
 * 
 * IMPORTANTE: Configure na DATABASE_URL:
 * - SSL: ?sslmode=require
 * - Connection Pool: &connection_limit=20&pool_timeout=20
 * 
 * Exemplo:
 * postgresql://user:password@host:5432/database?sslmode=require&connection_limit=20&pool_timeout=20
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' 
    ? [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
    : [{ emit: 'stdout', level: 'error' }],
  datasources: {
    db: {
      url: env.DATABASE_URL
    }
  }
});

// Log de queries em desenvolvimento
if (env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug('Query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`
    });
  });
}

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Encerrando conexão com o banco de dados...');
  await prisma.$disconnect();
  logger.info('Conexão encerrada');
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Reutilizar instância em desenvolvimento (hot reload)
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;










