/**
 * Validação de variáveis de ambiente obrigatórias
 * Este módulo valida todas as variáveis de ambiente necessárias no startup
 */

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  // Pagamentos (opcionais)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID_BASIC?: string;
  STRIPE_PRICE_ID_PROFESSIONAL?: string;
  STRIPE_PRICE_ID_ENTERPRISE?: string;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  MERCADOPAGO_WEBHOOK_SECRET?: string;
}

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'] as const;

export function validateEnv(): EnvConfig {
  const missing: string[] = [];

  // Validar variáveis obrigatórias
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    // Usar console.error aqui porque o logger pode não estar inicializado ainda
    const errorMsg = `❌ Erro: Variáveis de ambiente obrigatórias não encontradas: ${missing.join(', ')}`;
    console.error(errorMsg);
    console.error('\n💡 Dica: Configure essas variáveis no Vercel (Settings → Environment Variables)');
    
    // No Vercel, não fazer exit - lançar erro para que o Vercel mostre o erro corretamente
    if (process.env.VERCEL) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please configure them in Vercel Settings → Environment Variables`);
    } else {
      // Em desenvolvimento local, fazer exit
      process.exit(1);
    }
  }

  // Validar JWT_SECRET - não pode ser o valor padrão inseguro
  if (process.env.JWT_SECRET === 'clinify-secret-key-change-in-production') {
    const errorMsg = '❌ Erro: JWT_SECRET não pode usar o valor padrão inseguro.';
    console.error(errorMsg);
    console.error('💡 Dica: Gere uma chave secreta forte usando: openssl rand -base64 32\n');
    
    // No Vercel, não fazer exit - lançar erro
    if (process.env.VERCEL) {
      throw new Error('JWT_SECRET cannot use insecure default value. Please set a secure secret in Vercel Settings → Environment Variables');
    } else {
      process.exit(1);
    }
  }

  // Validar JWT_SECRET - deve ter pelo menos 32 caracteres
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  Aviso: JWT_SECRET deve ter pelo menos 32 caracteres para segurança.');
    console.warn('💡 Dica: Gere uma chave secreta forte usando: openssl rand -base64 32\n');
  }

  const config: EnvConfig = {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    // Pagamentos (opcionais)
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_BASIC: process.env.STRIPE_PRICE_ID_BASIC,
    STRIPE_PRICE_ID_PROFESSIONAL: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    STRIPE_PRICE_ID_ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  };

  return config;
}

export const env = validateEnv();

