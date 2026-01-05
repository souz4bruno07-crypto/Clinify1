# 🔄 Sistema de Renovação e Limpeza de Dados

## 📋 Resumo do Sistema

Sistema completo de gerenciamento de subscriptions com:
- ✅ Bloqueio após 30 dias de expiração para planos pagos
- ✅ Modal de renovação automático
- ✅ Persistência de dados por 30 dias após expiração
- ✅ Exclusão automática após 30 dias da expiração

## 🎯 Fluxo Completo

### Para Planos Pagos (Basic, Professional, Enterprise)

```
1. Subscription ativa
   ↓
2. Subscription expira (endDate passou)
   ↓
3. Status muda para 'past_due' (grace period de 30 dias)
   ↓
4. Modal de renovação aparece automaticamente
   ↓
5. Dados permanecem no banco por 30 dias
   ↓
6. Após 30 dias sem renovação:
   - Status muda para 'canceled'
   - Job de limpeza exclui TODOS os dados do usuário
   - Usuário e subscription são removidos do banco
```

### Para Plano Free (Trial)

```
1. Trial de 14 dias
   ↓
2. Após 14 dias → BLOQUEADO imediatamente
   ↓
3. Usuário precisa escolher um plano pago
```

## 🔧 Componentes Implementados

### 1. Backend - Middleware de Subscription (`backend/src/middlewares/subscription.ts`)

**Funções principais:**
- `checkAndUpdateExpiredSubscription()`: Verifica e atualiza status de subscriptions expiradas
- `isInGracePeriod()`: Verifica se está no período de grace (30 dias)
- `shouldDeleteData()`: Verifica se os dados devem ser excluídos

**Lógica de bloqueio:**
- Planos pagos: 30 dias de grace period antes de bloquear
- Plano free: Bloqueio imediato após 14 dias

### 2. Backend - Endpoint de Status (`backend/src/routes/billing.ts`)

**GET `/api/billing/subscription`**

Retorna informações completas sobre a subscription:
```json
{
  "id": "...",
  "plan": "professional",
  "status": "past_due",
  "endDate": "2024-01-15T00:00:00Z",
  "isExpired": true,
  "isPaidPlan": true,
  "daysSinceExpiration": 15,
  "daysRemaining": 15,
  "requiresRenewal": true,
  "shouldShowRenewalModal": true,
  "willBeDeleted": false
}
```

### 3. Backend - Job de Limpeza (`backend/src/jobs/cleanupExpiredData.ts`)

**Função:** `cleanupExpiredData()`

**O que faz:**
- Executa diariamente às 2h da manhã
- Busca subscriptions expiradas há mais de 30 dias
- Exclui todos os dados relacionados ao usuário:
  - Subscription
  - User
  - Transactions (cascade)
  - Patients (cascade)
  - Appointments (cascade)
  - E todos os outros dados relacionados

**Como executar manualmente:**
```bash
cd backend
npx tsx src/jobs/cleanupExpiredData.ts
```

### 4. Frontend - Modal de Renovação (`components/modals/RenewalModal.tsx`)

**Características:**
- Aparece automaticamente quando `shouldShowRenewalModal = true`
- Mostra aviso urgente se faltam menos de 7 dias
- Permite escolher plano para renovar
- Exibe contador de dias restantes

**Integração:**
- Verifica status da subscription a cada 5 minutos
- Mostra modal automaticamente quando necessário

### 5. Frontend - DashboardScreen (`components/DashboardScreen.tsx`)

**Verificação automática:**
- Verifica status da subscription ao carregar
- Verifica novamente a cada 5 minutos
- Mostra modal automaticamente quando necessário

## 📊 Status da Subscription

### Status Possíveis

| Status | Descrição | Acesso |
|--------|-----------|--------|
| `active` | Assinatura ativa e paga | ✅ Permitido |
| `trialing` | Período de teste (14 dias) | ✅ Permitido |
| `past_due` | Expirada, mas no grace period (30 dias) | ⚠️ Permitido com aviso |
| `canceled` | Cancelada ou expirada há mais de 30 dias | ❌ Bloqueado |
| `incomplete` | Pagamento incompleto | ❌ Bloqueado |

## 🗑️ Limpeza de Dados

### Quando os dados são excluídos?

1. **Subscription expirada há mais de 30 dias**
2. **Status = 'canceled' ou 'past_due'**
3. **Plano pago** (basic, professional, enterprise)

### O que é excluído?

- ✅ Subscription
- ✅ User
- ✅ Todos os dados relacionados (cascade):
  - Transactions
  - Patients
  - Appointments
  - Staff
  - Quotes
  - Inventory
  - Prescriptions
  - Medical Records
  - Loyalty Programs
  - E todos os outros dados

### Como funciona o job de limpeza?

```typescript
// Executa diariamente às 2h da manhã
// Busca subscriptions onde:
// - plan IN ['basic', 'professional', 'enterprise']
// - endDate < (hoje - 30 dias)
// - status IN ['canceled', 'past_due']
```

## 🔔 Notificações e Avisos

### Modal de Renovação

**Quando aparece:**
- Subscription expirada (dentro dos 30 dias)
- Subscription prestes a expirar (últimos 7 dias)

**O que mostra:**
- Dias restantes antes da exclusão
- Aviso urgente se faltam menos de 7 dias
- Opções de planos para renovar
- Botão para renovar

### Mensagens de Erro

**403 - SUBSCRIPTION_EXPIRED_GRACE_PERIOD:**
```
"Sua assinatura expirou. Você tem 30 dias para renovar antes que seus dados sejam excluídos."
```

**403 - SUBSCRIPTION_EXPIRED_DELETED:**
```
"Sua assinatura expirou há mais de 30 dias. Seus dados foram excluídos. Por favor, entre em contato com o suporte."
```

## 🚀 Como Usar

### 1. Verificar Status da Subscription

```typescript
const subscription = await api.get('/billing/subscription');
if (subscription?.shouldShowRenewalModal) {
  // Mostrar modal
}
```

### 2. Executar Limpeza Manualmente

```bash
cd backend
npx tsx src/jobs/cleanupExpiredData.ts
```

### 3. Agendar Limpeza Automática

O job já está configurado para executar automaticamente às 2h da manhã. Se precisar ajustar:

```typescript
// backend/src/index.ts
function startCleanupJob() {
  // Ajustar horário aqui
  tomorrow.setHours(2, 0, 0, 0); // 2h da manhã
}
```

## ⚙️ Configurações

### Grace Period (30 dias)

Para alterar o período de grace, edite:

```typescript
// backend/src/middlewares/subscription.ts
const GRACE_PERIOD_DAYS = 30; // Alterar aqui
```

### Horário do Job de Limpeza

```typescript
// backend/src/index.ts
tomorrow.setHours(2, 0, 0, 0); // Alterar horário aqui
```

## 📝 Exemplos SQL

### Ver subscriptions no grace period

```sql
SELECT 
  u.email,
  s.plan,
  s.status,
  s.end_date,
  CURRENT_DATE - s.end_date::date as dias_expirados,
  30 - (CURRENT_DATE - s.end_date::date) as dias_restantes
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.plan IN ('basic', 'professional', 'enterprise')
  AND s.end_date < CURRENT_DATE
  AND (CURRENT_DATE - s.end_date::date) < 30
ORDER BY s.end_date;
```

### Ver subscriptions que serão excluídas

```sql
SELECT 
  u.email,
  s.plan,
  s.status,
  s.end_date,
  CURRENT_DATE - s.end_date::date as dias_expirados
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.plan IN ('basic', 'professional', 'enterprise')
  AND s.end_date < (CURRENT_DATE - INTERVAL '30 days')
  AND s.status IN ('canceled', 'past_due')
ORDER BY s.end_date;
```

## ⚠️ Importante

1. **Backup antes de executar limpeza**: Os dados são excluídos permanentemente
2. **Teste em ambiente de desenvolvimento primeiro**
3. **Monitore logs do job de limpeza**
4. **Notifique usuários antes da exclusão** (opcional, pode ser implementado)

## 🔄 Próximos Passos (Opcional)

1. **Email de notificação**: Enviar email 7 dias antes da exclusão
2. **Exportação de dados**: Permitir exportar dados antes da exclusão
3. **Recuperação**: Sistema de recuperação de dados excluídos (backup)
