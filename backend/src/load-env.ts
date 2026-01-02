/**
 * Carregar variáveis de ambiente ANTES de qualquer outro módulo
 * Este arquivo deve ser importado PRIMEIRO em index.ts
 * 
 * Compatível com ESM e CommonJS - não usa import.meta para evitar erros de compilação
 */
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente - MÚLTIPLAS TENTATIVAS
// O tsx pode executar de diretórios diferentes, então tentamos vários caminhos
// Usamos apenas process.cwd() que funciona tanto em ESM quanto CommonJS
const cwd = process.cwd();

const possibleEnvPaths = [
  path.resolve(cwd, '.env'),                    // Pasta atual
  path.resolve(cwd, 'backend', '.env'),          // Se rodado da raiz
  path.resolve(cwd, '..', '.env'),               // Pasta pai
  path.resolve(cwd, '..', 'backend', '.env'),    // Backend na pasta pai
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    // Verificar se realmente carregou as variáveis
    if (process.env.DATABASE_URL && process.env.JWT_SECRET) {
      envLoaded = true;
      break;
    }
  }
}

// Última tentativa: carregar sem especificar caminho (usa padrão)
if (!envLoaded && !process.env.DATABASE_URL) {
  dotenv.config();
}

