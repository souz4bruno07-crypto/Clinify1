import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Instância do Redis para blacklist (opcional)
let redis: Redis | null = null;
if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries');
          return null; // Para de tentar
        }
        return Math.min(times * 50, 2000);
      }
    });
    
    redis.on('error', (err: Error) => {
      logger.warn('Redis error:', err.message);
    });
    
    redis.on('connect', () => {
      logger.info('Redis connected');
    });
  } catch (error) {
    logger.warn('Redis não disponível, blacklist desabilitada');
  }
}

/**
 * Verifica se um token está na blacklist
 */
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!redis) return false;
  
  try {
    const result = await redis.get(`blacklist:${token}`);
    return result === '1';
  } catch (error) {
    logger.warn('Erro ao verificar blacklist:', error);
    return false; // Em caso de erro, permitir o token
  }
};

/**
 * Adiciona um token à blacklist
 */
export const revokeToken = async (token: string): Promise<void> => {
  if (!redis) {
    logger.warn('Redis não disponível, não é possível revogar token');
    return;
  }
  
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.setex(`blacklist:${token}`, ttl, '1');
        logger.debug('Token revogado:', { ttl });
      }
    }
  } catch (error) {
    logger.error('Erro ao revogar token:', error);
  }
};

/**
 * Middleware de autenticação
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Token não fornecido');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      throw new UnauthorizedError('Token mal formatado');
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      throw new UnauthorizedError('Token mal formatado');
    }

    // Verificar blacklist
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token revogado');
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: string;
      type?: string;
    };

    // Verificar se é um access token
    if (decoded.type && decoded.type !== 'access') {
      throw new UnauthorizedError('Token inválido');
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: err.message, code: err.code });
      return;
    }
    
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
      return;
    }
    
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
      return;
    }
    
    logger.error('Erro no authMiddleware:', err);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
};

/**
 * Gera um par de tokens (access + refresh)
 */
export const generateTokenPair = (userId: string, role: string): {
  accessToken: string;
  refreshToken: string;
} => {
  const accessToken = jwt.sign(
    { id: userId, role, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: '15m' } // Access token expira em 15 minutos
  );
  
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Refresh token expira em 7 dias
  );
  
  return { accessToken, refreshToken };
};

/**
 * Gera apenas access token (para compatibilidade)
 * @deprecated Use generateTokenPair
 */
export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Verifica e decodifica refresh token
 */
export const verifyRefreshToken = (token: string): { id: string } => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
    id: string;
    type?: string;
  };
  
  if (decoded.type !== 'refresh') {
    throw new UnauthorizedError('Token inválido');
  }
  
  return { id: decoded.id };
};










