# ⚡ Solução Rápida - Usar Variáveis de Ambiente Diretamente

## 🎯 Se o .env não está funcionando, use esta solução:

### Passo 1: Exportar as variáveis

No terminal, execute (na pasta `backend/`):

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_vqTjo86OfzmU@ep-steep-bar-accrl4m1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=20&pool_timeout=10"
export JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="
export FRONTEND_URL="http://localhost:5173"
export PORT=3001
export NODE_ENV="development"
```

### Passo 2: Executar o servidor

```bash
npm run dev
```

---

## ✅ Vantagens desta solução:

- ✅ Funciona imediatamente
- ✅ Não depende do arquivo .env
- ✅ Não precisa instalar nada

## ⚠️ Desvantagem:

- ⚠️ Precisa exportar toda vez que abrir um novo terminal

---

## 💡 Solução Permanente (Opcional):

Para não precisar exportar toda vez, adicione ao seu `~/.zshrc` ou `~/.bashrc`:

```bash
# Clinify - Variáveis de Ambiente
export DATABASE_URL="postgresql://neondb_owner:npg_vqTjo86OfzmU@ep-steep-bar-accrl4m1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=20&pool_timeout=10"
export JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="
export FRONTEND_URL="http://localhost:5173"
export PORT=3001
export NODE_ENV="development"
```

Depois execute:
```bash
source ~/.zshrc  # ou source ~/.bashrc
```

---

## 🚀 Teste Agora:

1. Execute os comandos `export` acima
2. Execute `npm run dev`
3. Deve funcionar! 🎉




