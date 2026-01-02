import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    res.status(401).json({ error: 'Token mal formatado' });
    return;
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).json({ error: 'Token mal formatado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: string;
    };

    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
};

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};










