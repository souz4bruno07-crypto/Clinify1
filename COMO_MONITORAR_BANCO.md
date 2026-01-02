# 🗄️ Como Monitorar o Banco de Dados

## 🎯 Duas Formas de Monitorar:

---

## 1️⃣ Prisma Studio (Recomendado - Interface Visual)

### Como usar:

1. **Abra o terminal na pasta `backend/`**
2. **Execute:**
   ```bash
   cd backend
   npm run db:studio
   ```

3. **Aguarde alguns segundos** - o Prisma Studio vai abrir automaticamente no navegador
4. **URL:** http://localhost:5555

### O que você pode fazer:

- ✅ Ver todas as tabelas do banco
- ✅ Ver todos os dados (usuários, pacientes, transações, etc)
- ✅ Editar dados diretamente
- ✅ Adicionar novos registros
- ✅ Filtrar e buscar dados
- ✅ Interface visual e fácil de usar

### Exemplo de uso:

1. Clique em uma tabela (ex: `User`)
2. Veja todos os usuários cadastrados
3. Clique em um registro para ver detalhes
4. Edite campos diretamente na interface

---

## 2️⃣ Neon Console (No Navegador)

### Como acessar:

1. **Acesse:** https://console.neon.tech
2. **Faça login** na sua conta
3. **Clique no seu projeto** (Clinify)
4. **Vá em "SQL Editor"** ou "Tables"

### O que você pode fazer:

- ✅ Executar queries SQL
- ✅ Ver estrutura das tabelas
- ✅ Ver dados em formato de tabela
- ✅ Executar comandos SQL personalizados

### Exemplo de query:

```sql
-- Ver todos os usuários
SELECT * FROM users;

-- Ver quantos usuários existem
SELECT COUNT(*) FROM users;

-- Ver transações
SELECT * FROM transactions LIMIT 10;
```

---

## 📊 Comparação:

| Recurso | Prisma Studio | Neon Console |
|---------|---------------|--------------|
| Interface Visual | ✅ Excelente | ⚠️ Básica |
| Editar Dados | ✅ Sim | ❌ Não |
| Executar SQL | ❌ Não | ✅ Sim |
| Fácil de Usar | ✅ Muito | ⚠️ Médio |
| Requer Instalação | ❌ Não (já tem) | ❌ Não |

**💡 Recomendação:** Use **Prisma Studio** para monitorar e editar dados. Use **Neon Console** apenas se precisar executar SQL personalizado.

---

## 🚀 Iniciar Prisma Studio Agora:

```bash
cd backend
npm run db:studio
```

Depois acesse: http://localhost:5555

---

## 💡 Dica:

Mantenha o Prisma Studio aberto em uma aba do navegador enquanto desenvolve. Assim você pode ver em tempo real o que está sendo salvo no banco!



