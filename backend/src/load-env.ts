/**
 * Carregar variáveis de ambiente ANTES de qualquer outro módulo
 * Este arquivo deve ser importado PRIMEIRO em index.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente - MÚLTIPLAS TENTATIVAS
// O tsx pode executar de diretórios diferentes, então tentamos vários caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),                    // Pasta atual
  path.resolve(__dirname, '../../.env'),                  // Relativo ao arquivo
  path.join(process.cwd(), 'backend', '.env'),           // Se rodado da raiz
  path.resolve(__dirname, '../../../backend/.env'),       // Outro caminho relativo
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

