# 🔧 Correção do Sistema de Subscriptions

## 📋 O que foi corrigido

### 1. ✅ Criação Automática de Subscription no Signup
- Agora, quando um usuário se cadastra, uma subscription é criada automaticamente
- A subscription inicia com:
  - **Plano**: `free`
  - **Status**: `trialing` (período de teste)
  - **Duração**: 14 dias a partir da data de cadastro

### 2. ✅ Bloqueio Automático Após Trial
- Quando o trial de 14 dias expira, o sistema automaticamente:
  - Marca o status como `canceled`
  - **BLOQUEIA o acesso** - o usuário precisa escolher um plano pago para continuar
  - Exibe mensagem: "Seu período de teste de 14 dias expirou. Por favor, escolha um plano para continuar usando o sistema."

### 3. ✅ Script para Corrigir Usuários Existentes
- Script criado para adicionar subscriptions aos usuários que não têm

## 🚀 Como Executar o Script de Correção

### Opção 1: Usando tsx (recomendado)
```bash
cd backend
npx tsx src/scripts/fix-subscriptions.ts
```

### Opção 2: Compilando primeiro
```bash
cd backend
npm run build
node dist/scripts/fix-subscriptions.js
```

## 📊 O que o script faz

1. Busca todos os usuários no banco de dados
2. Identifica quais não têm subscription
3. Cria subscription para cada um:
   - Se o usuário foi criado há menos de 14 dias: cria com status `trialing` e expira em 14 dias
   - Se o usuário foi criado há mais de 14 dias: cria com status `active` e expira em 1 ano
4. Atualiza a coluna `plan` na tabela `users` também

## 🔍 Verificar se funcionou

### No banco de dados (SQL):
```sql
-- Ver todos os usuários e suas subscriptions
SELECT 
  u.id,
  u.name,
  u.email,
  s.plan,
  s.status,
  s.start_date,
  s.end_date
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.name;
```

### Usuários sem subscription:
```sql
SELECT 
  u.id,
  u.name,
  u.email
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.id IS NULL;
```

## ⚠️ Importante

1. **Trial de 14 dias**: Todos os novos usuários têm 14 dias de teste gratuito

2. **Bloqueio após trial**: Após os 14 dias, se o usuário não escolher um plano pago, o acesso será **BLOQUEADO**

3. **Planos pagos**: Apenas usuários com planos `basic`, `professional` ou `enterprise` ativos podem usar o sistema após o trial

4. **Novos usuários**: A partir de agora, todos os novos cadastros já terão subscription criada automaticamente

## 🎯 Resumo das Mudanças

| Situação | Antes | Depois |
|----------|-------|--------|
| Novo cadastro | ❌ Sem subscription | ✅ Subscription criada automaticamente |
| Trial expira | ❌ Bloqueava tudo | ✅ Converte para free ativo |
| Usuários antigos | ❌ Sem subscription | ✅ Script para corrigir |

## 📝 Próximos Passos

1. **Execute o script** para corrigir usuários existentes:
   ```bash
   cd backend
   npx tsx src/scripts/fix-subscriptions.ts
   ```

2. **Verifique no banco** se todas as subscriptions foram criadas

3. **Teste um novo cadastro** para confirmar que a subscription é criada automaticamente

## 🔄 Fluxo Completo

```
1. Usuário se cadastra
   ↓
2. Subscription criada: plan=free, status=trialing, 14 dias
   ↓
3. Usuário usa o sistema normalmente (trial)
   ↓
4. Após 14 dias (quando expira)
   ↓
5. Sistema marca como canceled e BLOQUEIA acesso
   ↓
6. Usuário precisa escolher um plano pago (basic/professional/enterprise)
   ↓
7. Após pagamento, subscription atualizada e acesso liberado
```

## ❓ Dúvidas?

- **"Vai bloquear tudo após 14 dias?"** 
  - ✅ SIM! Após 14 dias, se não pagar um plano, o acesso será bloqueado

- **"Como o usuário desbloqueia?"**
  - Escolhendo e pagando um plano (basic, professional ou enterprise)

- **"E se eu quiser dar trial de outro plano?"**
  - Você pode atualizar manualmente no banco ou usar a API de billing

- **"Como atualizar um usuário específico?"**
  - Veja o arquivo `docs/GERENCIAR_PLANOS_BANCO_DADOS.md` para exemplos SQL
