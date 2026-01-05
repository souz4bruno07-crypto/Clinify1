# 📋 Guia de Gerenciamento de Planos para Administradores

## Visão Geral

Os administradores (role `admin` ou `superadmin`) podem gerenciar os planos de assinatura de todos os usuários do sistema diretamente pela interface ou via API.

## 🎯 Como Funciona

### 1. Interface Visual (Recomendado)

**Localização:** Configurações → Equipe e Acessos

1. Acesse a seção **"Equipe e Acessos"** nas configurações
2. Na tabela de usuários, você verá uma coluna **"Plano"** mostrando o plano atual de cada usuário
3. Clique no ícone de **cartão de crédito** (💳) ao lado do usuário para gerenciar o plano
4. No modal que abrir:
   - Selecione o novo plano (Free, Basic, Professional ou Enterprise)
   - Defina o status (Ativo, Período de Teste, Cancelado, etc.)
   - Opcionalmente, defina uma data de expiração (ou deixe em branco para 1 ano)
5. Clique em **"Atualizar Plano"**

### 2. Via API (Para Integrações)

#### Obter Plano de um Usuário

```typescript
import { getUserPlanAdmin } from '../services/backendService';

const subscription = await getUserPlanAdmin(userId);
console.log(subscription.plan); // 'free', 'basic', 'professional' ou 'enterprise'
```

**Endpoint:** `GET /api/billing/subscription/admin/:userId`

**Resposta:**
```json
{
  "id": "subscription-id",
  "plan": "professional",
  "status": "active",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2025-01-01T00:00:00.000Z",
  "user": {
    "name": "Nome do Usuário",
    "email": "usuario@email.com"
  }
}
```

#### Atualizar Plano de um Usuário

```typescript
import { updateUserPlanAdmin } from '../services/backendService';

await updateUserPlanAdmin(
  userId,                    // ID do usuário
  'professional',            // Novo plano
  'active',                 // Status (opcional)
  '2025-12-31T23:59:59Z'   // Data de expiração (opcional)
);
```

**Endpoint:** `PUT /api/billing/subscription/admin/:userId`

**Body:**
```json
{
  "plan": "professional",
  "status": "active",
  "endDate": "2025-12-31T23:59:59Z"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Plano atualizado para Nome do Usuário (usuario@email.com)",
  "subscription": {
    "id": "subscription-id",
    "userId": "user-id",
    "plan": "professional",
    "status": "active",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z"
  }
}
```

## 🔐 Permissões

- **Apenas usuários com role `admin` ou `superadmin`** podem gerenciar planos
- Tentativas de acesso não autorizado retornam erro `403 Forbidden`

## 📊 Planos Disponíveis

### Free (Gratuito)
- **Limites:**
  - 50 pacientes
  - 1 usuário
  - 1GB de armazenamento
  - 200 agendamentos/mês
  - 500 transações/mês
- **Módulos:** Financeiro básico, Pacientes, Agenda simples

### Basic (R$ 99/mês)
- **Limites:**
  - 200 pacientes
  - 3 usuários
  - 10GB de armazenamento
  - 1.000 agendamentos/mês
  - 2.000 transações/mês
- **Módulos:** Todos os financeiros, CRM básico, Relatórios avançados

### Professional (R$ 299/mês)
- **Limites:**
  - Pacientes ilimitados
  - 10 usuários
  - 100GB de armazenamento
  - Agendamentos ilimitados
  - Transações ilimitadas
- **Módulos:** Todos incluindo IA, PEP, Estoque, Fidelidade, Comissões

### Enterprise (R$ 799/mês)
- **Limites:**
  - Tudo ilimitado
  - Usuários ilimitados
  - 1TB de armazenamento
- **Módulos:** Tudo + White-label, Multi-filial, Integrações personalizadas

## ⚙️ Status de Assinatura

- **`active`**: Assinatura ativa e funcionando
- **`trialing`**: Período de teste (trial)
- **`canceled`**: Assinatura cancelada
- **`past_due`**: Pagamento atrasado
- **`incomplete`**: Assinatura incompleta

## 🔄 Fluxo de Atualização

1. Admin acessa a interface de gerenciamento
2. Seleciona o usuário e clica em "Gerenciar Plano"
3. Escolhe o novo plano e configurações
4. Sistema valida:
   - Permissões do admin
   - Existência do usuário
   - Validade do plano escolhido
5. Atualiza ou cria a assinatura no banco de dados
6. Limitações são aplicadas automaticamente nas rotas

## 🛡️ Verificações Automáticas

O sistema verifica automaticamente os limites do plano quando:

- **Criar paciente:** Verifica limite de pacientes
- **Criar transação:** Verifica limite mensal de transações
- **Criar agendamento:** Verifica limite mensal de agendamentos
- **Acessar módulos:** Verifica se o módulo está disponível no plano

## 📝 Exemplos de Uso

### Exemplo 1: Upgrade de Plano

```typescript
// Upgrade um usuário para Professional
await updateUserPlanAdmin(
  'user-id-123',
  'professional',
  'active'
);
```

### Exemplo 2: Criar Trial

```typescript
// Criar período de teste de 30 dias
const trialEndDate = new Date();
trialEndDate.setDate(trialEndDate.getDate() + 30);

await updateUserPlanAdmin(
  'user-id-123',
  'professional',
  'trialing',
  trialEndDate.toISOString()
);
```

### Exemplo 3: Cancelar Assinatura

```typescript
// Cancelar assinatura mantendo acesso até o final do período
await updateUserPlanAdmin(
  'user-id-123',
  'free',
  'canceled'
);
```

## 🚨 Importante

- **Data de Expiração:** Se não especificada e status for `active`, será definida automaticamente para 1 ano a partir de hoje
- **Validação:** O sistema valida que o plano escolhido é válido (`free`, `basic`, `professional` ou `enterprise`)
- **Logs:** Todas as alterações são registradas no log do sistema para auditoria
- **Limitações:** As limitações são aplicadas em tempo real após a atualização

## 🔍 Troubleshooting

### Erro: "Acesso negado"
- Verifique se o usuário tem role `admin` ou `superadmin`

### Erro: "Usuário não encontrado"
- Verifique se o `userId` está correto

### Erro: "Plano inválido"
- Use apenas: `free`, `basic`, `professional` ou `enterprise`

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação da API ou entre em contato com o suporte técnico.
