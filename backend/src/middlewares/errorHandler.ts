import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

/**
 * Middleware centralizado de tratamento de erros
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Erro de validação Zod
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    logger.warn('Erro de validação:', {
      path: req.path,
      method: req.method,
      errors: errorMessages
    });
    
    res.status(400).json({
      error: 'Erro de validação',
      code: 'VALIDATION_ERROR',
      details: errorMessages
    });
    return;
  }

  // Erro customizado AppError
  if (err instanceof AppError) {
    logger.warn('Erro da aplicação:', {
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
      details: err.details
    });
    
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details })
    });
    return;
  }

  // Erro não tratado
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  // Em produção, não expor detalhes do erro
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && {
      message: err.message,
      stack: err.stack
    })
  });
};

/**
 * Wrapper para rotas async que captura erros automaticamente
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
