# Comandos do Prisma - Guia Rápido

## 📋 Comandos Principais

### 1. Validar o Schema
Verifica se o schema.prisma está correto sem erros:
```bash
npx prisma validate
```
ou usando o script npm:
```bash
npm run db:generate  # também valida ao gerar
```

### 2. Gerar o Prisma Client
Gera o cliente TypeScript baseado no schema (execute após mudanças no schema):
```bash
npx prisma generate
```
ou usando o script npm:
```bash
npm run db:generate
```

### 3. Criar Migração (Recomendado para Produção)
Cria uma migração SQL baseada nas mudanças do schema:
```bash
npx prisma migrate dev --name nome_da_migracao
```
ou usando o script npm:
```bash
npm run db:migrate
```

**Para adicionar os novos modelos que criamos:**
```bash
npx prisma migrate dev --name add_missing_models
```

### 4. Aplicar Schema Diretamente (Desenvolvimento)
Aplica as mudanças diretamente ao banco sem criar arquivos de migração:
```bash
npx prisma db push
```
ou usando o script npm:
```bash
npm run db:push
```

⚠️ **Atenção**: `db push` é útil para desenvolvimento rápido, mas não cria histórico de migrações. Use `migrate dev` para produção.

### 5. Abrir Prisma Studio (Interface Visual)
Abre uma interface web para visualizar e editar dados:
```bash
npx prisma studio
```
ou usando o script npm:
```bash
npm run db:studio
```

### 6. Formatar o Schema
Formata o arquivo schema.prisma:
```bash
npx prisma format
```

### 7. Reset do Banco (⚠️ CUIDADO - Apaga todos os dados)
Reseta o banco de dados e executa todas as migrações:
```bash
npx prisma migrate reset
```

---

## 🔄 Fluxo Recomendado Após Mudanças no Schema

1. **Editar** `prisma/schema.prisma`

2. **Validar** o schema:
   ```bash
   npx prisma validate
   ```

3. **Criar migração**:
   ```bash
   npx prisma migrate dev --name descricao_da_mudanca
   ```
   
   Isso vai:
   - Validar o schema
   - Criar arquivos de migração SQL
   - Aplicar a migração ao banco
   - Gerar o Prisma Client automaticamente

4. **Gerar o Client** (se necessário):
   ```bash
   npx prisma generate
   ```

---

## 📝 Para o Seu Caso Específico

Após adicionar os novos modelos (StaffTarget, MedicalRecord, etc.), execute:

```bash
cd backend
npx prisma migrate dev --name add_missing_models
```

Ou se preferir aplicar direto sem criar migração (apenas desenvolvimento):

```bash
cd backend
npx prisma db push
```

Depois, sempre gere o cliente:

```bash
npx prisma generate
```





