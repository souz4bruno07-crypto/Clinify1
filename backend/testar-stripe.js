// Script para testar a conexão com o Stripe
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env') });

console.log('\n🔍 Testando configuração do Stripe...\n');

// Verificar variáveis de ambiente
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceIdBasic = process.env.STRIPE_PRICE_ID_BASIC;
const stripePriceIdProfessional = process.env.STRIPE_PRICE_ID_PROFESSIONAL;
const stripePriceIdEnterprise = process.env.STRIPE_PRICE_ID_ENTERPRISE;

console.log('📋 Variáveis de ambiente:');
console.log(`  STRIPE_SECRET_KEY: ${stripeSecretKey ? stripeSecretKey.substring(0, 7) + '...' + stripeSecretKey.substring(stripeSecretKey.length - 4) : '❌ NÃO CONFIGURADO'}`);
console.log(`  STRIPE_PRICE_ID_BASIC: ${stripePriceIdBasic || '❌ NÃO CONFIGURADO'}`);
console.log(`  STRIPE_PRICE_ID_PROFESSIONAL: ${stripePriceIdProfessional || '❌ NÃO CONFIGURADO'}`);
console.log(`  STRIPE_PRICE_ID_ENTERPRISE: ${stripePriceIdEnterprise || '❌ NÃO CONFIGURADO'}`);
console.log('');

if (!stripeSecretKey) {
  console.error('❌ ERRO: STRIPE_SECRET_KEY não está configurado!');
  console.log('\n💡 Como configurar:');
  console.log('  1. Acesse https://dashboard.stripe.com/apikeys');
  console.log('  2. Copie sua chave secreta (sk_test_... ou sk_live_...)');
  console.log('  3. Adicione no arquivo .env: STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

// Testar conexão com Stripe
console.log('🔌 Testando conexão com Stripe...');
try {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  // Testar listagem de clientes (chamada simples)
  const customers = await stripe.customers.list({ limit: 1 });
  console.log('✅ Conexão com Stripe OK!');
  console.log(`   Modo: ${stripeSecretKey.startsWith('sk_live_') ? 'PRODUÇÃO' : 'TESTE'}`);
  console.log('');

  // Verificar se os Price IDs existem
  if (stripePriceIdBasic) {
    console.log(`🔍 Verificando Price ID Basic: ${stripePriceIdBasic}...`);
    try {
      const price = await stripe.prices.retrieve(stripePriceIdBasic);
      console.log(`✅ Price ID Basic válido!`);
      console.log(`   Produto: ${price.product}`);
      console.log(`   Valor: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
      console.log(`   Recorrente: ${price.recurring ? 'Sim' : 'Não'}`);
    } catch (error) {
      console.error(`❌ Price ID Basic inválido: ${error.message}`);
    }
    console.log('');
  }

  if (stripePriceIdProfessional) {
    console.log(`🔍 Verificando Price ID Professional: ${stripePriceIdProfessional}...`);
    try {
      const price = await stripe.prices.retrieve(stripePriceIdProfessional);
      console.log(`✅ Price ID Professional válido!`);
      console.log(`   Produto: ${price.product}`);
      console.log(`   Valor: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
      console.log(`   Recorrente: ${price.recurring ? 'Sim' : 'Não'}`);
    } catch (error) {
      console.error(`❌ Price ID Professional inválido: ${error.message}`);
    }
    console.log('');
  }

  if (stripePriceIdEnterprise) {
    console.log(`🔍 Verificando Price ID Enterprise: ${stripePriceIdEnterprise}...`);
    try {
      const price = await stripe.prices.retrieve(stripePriceIdEnterprise);
      console.log(`✅ Price ID Enterprise válido!`);
      console.log(`   Produto: ${price.product}`);
      console.log(`   Valor: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
      console.log(`   Recorrente: ${price.recurring ? 'Sim' : 'Não'}`);
    } catch (error) {
      console.error(`❌ Price ID Enterprise inválido: ${error.message}`);
    }
    console.log('');
  }

  console.log('✅ Todos os testes concluídos!');
} catch (error) {
  console.error('❌ ERRO ao conectar com Stripe:');
  console.error(`   Tipo: ${error.type || 'Desconhecido'}`);
  console.error(`   Mensagem: ${error.message}`);
  console.error(`   Código: ${error.code || 'N/A'}`);
  
  if (error.type === 'StripeAuthenticationError') {
    console.log('\n💡 A chave secreta do Stripe está incorreta ou inválida.');
    console.log('   Verifique se você copiou a chave correta do Stripe Dashboard.');
  } else if (error.type === 'StripeAPIError') {
    console.log('\n💡 Erro na API do Stripe. Verifique sua conexão com a internet.');
  }
  
  process.exit(1);
}




