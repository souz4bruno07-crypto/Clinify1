// IMPORTAR load-env PRIMEIRO - isso carrega o .env antes de qualquer outro módulo
import './load-env.js';

import express, { Request } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { env } from './config/env.js';
import { securityMiddleware, customSecurityHeaders } from './middlewares/security.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Estender o tipo Request para incluir rateLimit
interface RateLimitRequest extends Request {
  rateLimit?: {
    resetTime?: number;
  };
}

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import patientRoutes from './routes/patients.js';
import staffRoutes from './routes/staff.js';
import appointmentRoutes from './routes/appointments.js';
import quoteRoutes from './routes/quotes.js';
import targetRoutes from './routes/targets.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/users.js';
import inventoryRoutes from './routes/inventory.js';
import prescriptionRoutes from './routes/prescriptions.js';
import billingRoutes from './routes/billing.js';
import loyaltyRoutes from './routes/loyalty.js';
import medicalRecordRoutes from './routes/medical-records.js';
import evolutionRoutes from './routes/evolution.js';

// Validar variáveis de ambiente obrigatórias (isso vai encerrar o processo se faltar algo)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _env = env;

const app = express();
const PORT = env.PORT;

// Rate Limiter para autenticação (prevenção de brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por 15 minutos
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: RateLimitRequest, res) => {
    const windowMs = 15 * 60 * 1000;
    const resetTime = req.rateLimit?.resetTime || Date.now() + windowMs;
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      error: 'Muitas tentativas de autenticação. Por favor, tente novamente em alguns minutos.',
      retryAfter: retryAfter,
    });
  },
});

// Rate Limiter geral para todas as rotas da API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200, // Aumentado para 200 req/min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: RateLimitRequest, res) => {
    const windowMs = 60 * 1000;
    const resetTime = req.rateLimit?.resetTime || Date.now() + windowMs;
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      error: 'Muitas requisições deste IP. Por favor, tente novamente em alguns minutos.',
      retryAfter: retryAfter,
    });
  },
});

// Rate limiter para operações pesadas (relatórios, exports, etc)
const heavyOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Apenas 10 operações pesadas por minuto
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: RateLimitRequest, res) => {
    const windowMs = 60 * 1000;
    const resetTime = req.rateLimit?.resetTime || Date.now() + windowMs;
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      error: 'Muitas operações pesadas. Por favor, aguarde antes de tentar novamente.',
      retryAfter: retryAfter,
    });
  },
});

// Middlewares de segurança
app.use(securityMiddleware);
app.use(customSecurityHeaders);

// CORS - permitir requisições do frontend e health checks
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (como health checks diretos)
    if (!origin) {
      return callback(null, true);
    }
    // Permitir requisições do frontend configurado
    if (origin === env.FRONTEND_URL || origin.startsWith(env.FRONTEND_URL)) {
      return callback(null, true);
    }
    // Em desenvolvimento, permitir localhost
    if (env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rota raiz - informações da API
app.get('/', (_, res) => {
  res.json({
    name: 'Clinify Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI - Documentação da API
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Clinify API Documentation',
  customfavIcon: '/favicon.ico'
}));

// Endpoint JSON da documentação
app.get('/api/docs.json', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rotas da API com rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', apiLimiter, transactionRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/patients', apiLimiter, patientRoutes);
app.use('/api/staff', apiLimiter, staffRoutes);
app.use('/api/appointments', apiLimiter, appointmentRoutes);
app.use('/api/quotes', apiLimiter, quoteRoutes);
app.use('/api/targets', apiLimiter, targetRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/inventory', apiLimiter, inventoryRoutes);
app.use('/api/prescriptions', apiLimiter, prescriptionRoutes);
app.use('/api/billing', apiLimiter, billingRoutes);
app.use('/api/loyalty', apiLimiter, loyaltyRoutes);
app.use('/api/medical-records', apiLimiter, medicalRecordRoutes);
app.use('/api/evolution', apiLimiter, evolutionRoutes);

// Rotas com rate limiting para operações pesadas (aplicar em rotas específicas dentro dos routers)
// Exemplo: router.get('/report', heavyOperationLimiter, ...)

import { logger } from './config/logger.js';

// Error handler global (deve ser o último middleware)
app.use(errorHandler);

// Exportar o app para o Vercel (serverless)
export default app;

// Iniciar servidor apenas em desenvolvimento local
// No Vercel, o app é exportado e executado como função serverless
const isLocal = process.env.NODE_ENV !== 'production' || !process.env.VERCEL;

if (isLocal) {
  app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`📚 Documentação Swagger: http://localhost:${PORT}/api/docs`);
    
    // Iniciar job de limpeza diária apenas em ambiente local
    // No Vercel, use Vercel Cron Jobs ou funções serverless agendadas
    startCleanupJob();
  });
}

// Job de limpeza de dados expirados (apenas em ambiente local)
function startCleanupJob() {
  // Importar dinamicamente apenas quando necessário (não no Vercel)
  import('./jobs/cleanupExpiredData.js')
    .then(({ cleanupExpiredData }) => {
      // Executar diariamente às 2h da manhã
      const scheduleCleanup = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0); // 2h da manhã

        const msUntilNextRun = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
          logger.info('🕐 Executando job de limpeza de dados expirados...');
          cleanupExpiredData()
            .then(() => {
              logger.info('✅ Job de limpeza concluído');
              // Agendar próxima execução
              scheduleCleanup();
            })
            .catch((err) => {
              logger.error('❌ Erro no job de limpeza:', err);
              // Agendar próxima execução mesmo em caso de erro
              scheduleCleanup();
            });
        }, msUntilNextRun);

        logger.info(`📅 Próxima limpeza agendada para: ${tomorrow.toLocaleString('pt-BR')}`);
      };

      scheduleCleanup();
    })
    .catch((err) => {
      logger.warn('⚠️  Não foi possível carregar job de limpeza (normal no Vercel):', err.message);
    });
}

