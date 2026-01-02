// Script para testar se o .env está sendo lido corretamente
require('dotenv').config();

console.log('\n🔍 Verificando variáveis de ambiente:\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Encontrada' : '❌ NÃO encontrada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Encontrada' : '❌ NÃO encontrada');

if (process.env.DATABASE_URL) {
  console.log('\n📋 DATABASE_URL (primeiros 50 caracteres):', process.env.DATABASE_URL.substring(0, 50) + '...');
}

if (process.env.JWT_SECRET) {
  console.log('📋 JWT_SECRET (primeiros 20 caracteres):', process.env.JWT_SECRET.substring(0, 20) + '...');
}

console.log('\n');


