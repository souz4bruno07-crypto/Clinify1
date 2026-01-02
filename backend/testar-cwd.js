// Testar onde está o process.cwd() quando executado via tsx
const path = require('path');
const fs = require('fs');

console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);

const envPath = path.resolve(process.cwd(), '.env');
console.log('Caminho do .env:', envPath);
console.log('.env existe?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('\n✅ Arquivo .env encontrado!');
  const content = fs.readFileSync(envPath, 'utf8');
  const hasDatabaseUrl = content.includes('DATABASE_URL');
  const hasJwtSecret = content.includes('JWT_SECRET');
  console.log('Tem DATABASE_URL?', hasDatabaseUrl);
  console.log('Tem JWT_SECRET?', hasJwtSecret);
} else {
  console.log('\n❌ Arquivo .env NÃO encontrado!');
  console.log('\nProcurando em outros lugares...');
  
  const altPaths = [
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
  ];
  
  altPaths.forEach(p => {
    console.log(`  ${p}: ${fs.existsSync(p) ? '✅' : '❌'}`);
  });
}



