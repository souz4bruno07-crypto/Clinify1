# ✅ Configuração Final do .env

## 🎯 Você já tem tudo! Agora vamos colocar no arquivo .env

---

## 📝 O que você precisa colocar no arquivo `.env`:

Abra o arquivo `backend/.env` e configure assim:

```env
DATABASE_URL="postgresql://neondb_owner:npg_vqTjo86OfzmU@ep-steep-bar-accrl4m1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=20&pool_timeout=10"

JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="

FRONTEND_URL="http://localhost:5173"

PORT=3001

NODE_ENV="development"
```

---

## ✅ Checklist:

- [ ] Abriu o arquivo `backend/.env`
- [ ] Colou a `DATABASE_URL` acima
- [ ] Colou o `JWT_SECRET` acima
- [ ] Salvou o arquivo
- [ ] Pronto para testar!

---

## 🚀 Agora vamos testar!

Execute no terminal:

```bash
cd backend
npm run db:migrate
npm run dev
```

Se aparecer "Servidor rodando", está tudo certo! 🎉


