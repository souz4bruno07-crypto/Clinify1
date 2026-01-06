// Handler para o Vercel - importa o app do dist após o build
// Este arquivo é executado pelo Vercel após o build gerar o dist/

// Logs para debug (executados quando o módulo é carregado)
console.log('🔄 Carregando handler do Vercel...');
console.log('CWD:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);

// Importação estática - se o dist/ não foi gerado, isso vai falhar
// e o erro será mostrado nos logs do Vercel
// O Vercel executa o build antes de rodar as funções, então dist/index.js deve existir
import appModule from '../dist/index.js';

// Verificar se o app foi exportado corretamente
if (!appModule || !appModule.default) {
  throw new Error('App não foi exportado corretamente do dist/index.js. Verifique se o arquivo exporta default app e se o build foi executado (npm run build na pasta backend).');
}

const app = appModule.default;
console.log('✅ App carregado com sucesso');

export default app;

