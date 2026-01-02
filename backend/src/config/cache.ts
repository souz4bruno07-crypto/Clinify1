import { logger } from './logger.js';

// Redis é opcional - importar apenas se disponível
let Redis: any = null;
let redis: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Redis = require('ioredis');
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number): number => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    connectTimeout: 1000, // Timeout de conexão de 1 segundo
    commandTimeout: 500, // Timeout de comando de 500ms
    lazyConnect: true, // Não conectar automaticamente
  });
} catch (error) {
  logger.warn('Redis não disponível - cache desabilitado');
}

// Helper para cache com fallback gracioso
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Redis get error (fallback para null):', error);
      return null; // Fallback: retorna null se Redis falhar
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!redis) return;
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.warn('Redis set error (continuando sem cache):', error);
      // Não lança erro - permite que a aplicação continue sem cache
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      logger.warn('Redis del error:', error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Redis invalidate error:', error);
    }
  }
};

export default redis;

