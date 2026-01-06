/**
 * Sistema de Logging estruturado com Winston
 * Logs estruturados em JSON para produção
 */

import winston from 'winston';
import { env } from './env.js';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const transports: winston.transport[] = [];

// Em produção, salvar logs em arquivos
if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Console sempre ativo
transports.push(
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: env.NODE_ENV === 'production' ? 'info' : 'debug'
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  transports,
  // Não sair do processo em caso de erro de logging
  exitOnError: false
});

// Interface para compatibilidade com código existente
export default logger;




