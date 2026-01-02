/**
 * Script para verificar conexões do Clinify (Banco de Dados e Stripe)
 * Execute: node verificar-conexoes.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('\n🔍 Verificando Conexões do Clinify\n');
console.log('='.repeat(60));

// ============================================
// 1. VERIFICAR BANCO DE DADOS
// ============================================
console.log('\n📊 1. VERIFICAÇÃO DO BANCO DE DADOS');
console.log('-'.repeat(60));

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('❌ DATABASE_URL não encontrada');
  console.log('   Configure a variável DATABASE_URL no arquivo .env');
} else {
  console.log('✅ DATABASE_URL encontrada');
  
  // Verificar se tem connection pooling
  const hasPooling = DATABASE_URL.includes('connection_limit') || 
                     DATABASE_URL.includes('pgbouncer') ||
                     DATABASE_URL.includes('pool_timeout');
  
  if (hasPooling) {
    console.log('✅ Connection pooling configurado na URL');
  } else {
    console.log('⚠️  Connection pooling NÃO detectado na URL');
    console.log('   Recomendado adicionar: ?connection_limit=20&pool_timeout=10');
    console.log('   Ou usar connection pooler (Neon/Supabase)');
  }
  
  // Tentar conectar ao banco
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error'],
    });
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco de dados: OK');
    
    // Testar query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste: OK');
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Erro ao conectar ao banco de dados:');
    console.log(`   ${error.message}`);
    if (error.code === 'P1001') {
      console.log('   Possível causa: Servidor de banco não está acessível');
    } else if (error.code === 'P1000') {
      console.log('   Possível causa: Credenciais inválidas');
    }
  }
}

// ============================================
// 2. VERIFICAR STRIPE
// ============================================
console.log('\n💳 2. VERIFICAÇÃO DO STRIPE');
console.log('-'.repeat(60));

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID_BASIC = process.env.STRIPE_PRICE_ID_BASIC;
const STRIPE_PRICE_ID_PROFESSIONAL = process.env.STRIPE_PRICE_ID_PROFESSIONAL;
const STRIPE_PRICE_ID_ENTERPRISE = process.env.STRIPE_PRICE_ID_ENTERPRISE;

if (!STRIPE_SECRET_KEY) {
  console.log('⚠️  STRIPE_SECRET_KEY não encontrada (Stripe opcional)');
  console.log('   Configure se quiser usar pagamentos via Stripe');
} else {
  console.log('✅ STRIPE_SECRET_KEY encontrada');
  
  // Verificar se é chave de teste ou produção
  if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('   📝 Modo: TESTE (sk_test_)');
  } else if (STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.log('   🚀 Modo: PRODUÇÃO (sk_live_)');
  } else {
    console.log('   ⚠️  Formato de chave não reconhecido');
  }
  
  // Testar conexão com Stripe
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
    
    // Testar API call simples
    await stripe.customers.list({ limit: 1 });
    console.log('✅ Conexão com Stripe API: OK');
  } catch (error) {
    console.log('❌ Erro ao conectar com Stripe:');
    console.log(`   ${error.message}`);
    if (error.type === 'StripeAuthenticationError') {
      console.log('   Possível causa: Chave secreta inválida');
    }
  }
}

if (!STRIPE_WEBHOOK_SECRET) {
  console.log('⚠️  STRIPE_WEBHOOK_SECRET não encontrada');
  console.log('   Configure para que webhooks funcionem');
} else {
  console.log('✅ STRIPE_WEBHOOK_SECRET encontrada');
}

// Verificar Price IDs
const priceIds = {
  basic: STRIPE_PRICE_ID_BASIC,
  professional: STRIPE_PRICE_ID_PROFESSIONAL,
  enterprise: STRIPE_PRICE_ID_ENTERPRISE,
};

console.log('\n📦 Price IDs configurados:');
Object.entries(priceIds).forEach(([plan, priceId]) => {
  if (priceId) {
    console.log(`   ✅ ${plan}: ${priceId}`);
  } else {
    console.log(`   ⚠️  ${plan}: não configurado`);
  }
});

// ============================================
// 3. VERIFICAR OUTRAS VARIÁVEIS
// ============================================
console.log('\n🔐 3. OUTRAS VARIÁVEIS DE AMBIENTE');
console.log('-'.repeat(60));

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PORT = process.env.PORT || '3001';
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!JWT_SECRET) {
  console.log('❌ JWT_SECRET não encontrada (OBRIGATÓRIA)');
  console.log('   Gere com: openssl rand -base64 32');
} else {
  console.log('✅ JWT_SECRET encontrada');
  if (JWT_SECRET.length < 32) {
    console.log('   ⚠️  JWT_SECRET deve ter pelo menos 32 caracteres');
  }
  if (JWT_SECRET === 'clinify-secret-key-change-in-production') {
    console.log('   ⚠️  JWT_SECRET ainda está com o valor padrão inseguro!');
  }
}

if (!FRONTEND_URL) {
  console.log('⚠️  FRONTEND_URL não encontrada');
  console.log('   Usará padrão: http://localhost:5173');
} else {
  console.log(`✅ FRONTEND_URL: ${FRONTEND_URL}`);
}

console.log(`✅ PORT: ${PORT}`);
console.log(`✅ NODE_ENV: ${NODE_ENV}`);

// ============================================
// 4. RESUMO
// ============================================
console.log('\n📋 RESUMO');
console.log('='.repeat(60));

const issues = [];
const warnings = [];

if (!DATABASE_URL) issues.push('DATABASE_URL não configurada');
if (!JWT_SECRET) issues.push('JWT_SECRET não configurada');

if (!STRIPE_SECRET_KEY) warnings.push('Stripe não configurado (opcional)');
if (!STRIPE_WEBHOOK_SECRET && STRIPE_SECRET_KEY) warnings.push('STRIPE_WEBHOOK_SECRET não configurada (webhooks não funcionarão)');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ Todas as verificações passaram!');
  console.log('   O sistema está pronto para deploy.');
} else {
  if (issues.length > 0) {
    console.log('\n❌ PROBLEMAS CRÍTICOS (impedem o funcionamento):');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  AVISOS (não impedem o funcionamento básico):');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Verificação concluída!\n');



