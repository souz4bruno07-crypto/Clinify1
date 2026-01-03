# 🔧 Solução Alternativa - Se Ainda Não Funcionar

## Se o erro persistir, tente esta solução:

### Opção 1: Usar dotenv-cli (Recomendado)

Execute no terminal (na pasta `backend/`):

```bash
npm install --save-dev dotenv-cli
```

Depois, modifique o `package.json`:

```json
"dev": "dotenv -e .env -- tsx watch src/index.ts"
```

---

### Opção 2: Criar um script wrapper

Crie um arquivo `start-dev.js` na pasta `backend/`:

```javascript
require('dotenv').config();
const { spawn } = require('child_process');

spawn('npx', ['tsx', 'watch', 'src/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});
```

E mude o script para:
```json
"dev": "node start-dev.js"
```

---

### Opção 3: Verificar se o arquivo .env está correto

Abra o arquivo `.env` e verifique:

1. **Não há espaços antes do `=`**
   - ❌ ERRADO: `DATABASE_URL = "..."`
   - ✅ CORRETO: `DATABASE_URL="..."`

2. **Todos os valores estão entre aspas**
   - ❌ ERRADO: `JWT_SECRET=abc123`
   - ✅ CORRETO: `JWT_SECRET="abc123"`

3. **Não há linhas vazias extras no meio**

4. **O arquivo termina com uma linha em branco** (opcional)

---

### Opção 4: Usar variáveis de ambiente do sistema

Em vez de usar `.env`, você pode exportar as variáveis diretamente:

```bash
export DATABASE_URL="postgresql://..."
export JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="
export FRONTEND_URL="http://localhost:5173"
export PORT=3001
export NODE_ENV="development"

npm run dev
```

---

## 🎯 Qual tentar primeiro?

1. **Opção 1** (dotenv-cli) - Mais simples e confiável
2. **Opção 4** (export) - Funciona imediatamente, mas precisa exportar toda vez

Me diga qual você quer tentar!




