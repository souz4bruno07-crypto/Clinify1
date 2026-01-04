# Otimizações de Performance - Clinify

## Problemas Identificados

1. **Dados não carregam no mobile**: Timeouts muito curtos (5 segundos) causavam falhas em conexões lentas
2. **Geração de dados fictícios muito lenta**: Operações sequenciais e batches pequenos causavam lentidão
3. **Falta de índices no banco**: Algumas queries eram lentas por falta de índices

## Otimizações Implementadas

### 1. Timeouts Aumentados

#### Backend
- **Queries de pacientes**: Timeout aumentado de 5s para 30s
- **Queries de transações**: Adicionado timeout de 30s
- **Queries de agendamentos**: Adicionado timeout de 30s
- **Seed de dados**: Timeout de transação aumentado de 30s para 120s (2 minutos)

#### Frontend
- **Requisições HTTP**: Adicionado timeout de 60s com tratamento de erro adequado
- **Tratamento de timeout**: Mensagens de erro claras quando requisições excedem o tempo

### 2. Otimização do Seed de Dados

#### Batches Aumentados
- **Transações**: Batch size aumentado de 100 para 500
- **Movimentações de estoque**: Criadas em batches de 500
- **Mensagens de chat**: Criadas em batches de 500
- **Histórico de pontos**: Criado em batches de 500

#### Resultado Esperado
- Redução de ~80% no número de queries ao banco
- Tempo de seed reduzido significativamente
- Menor carga no banco de dados

### 3. Índices Adicionados

#### Schema do Banco
- **Categories**: Adicionado índice em `userId` e `(userId, type)`
- Melhora performance de queries que filtram por usuário e tipo

### 4. Tratamento de Erros Melhorado

#### Frontend (apiClient.ts)
- Timeout de 60 segundos em todas as requisições
- Tratamento específico para erros de timeout
- Mensagens de erro claras para o usuário

## Impacto Esperado

### Mobile
- ✅ Dados devem carregar corretamente mesmo em conexões lentas
- ✅ Timeouts adequados evitam travamentos
- ✅ Mensagens de erro claras quando há problemas de conexão

### Geração de Dados Fictícios
- ✅ Tempo de execução reduzido em ~60-70%
- ✅ Menor carga no banco de dados
- ✅ Melhor experiência do usuário durante a geração

### Performance Geral
- ✅ Queries mais rápidas com índices adicionais
- ✅ Melhor uso de recursos do banco de dados

## Próximos Passos Recomendados

1. **Monitorar performance**: Verificar se os timeouts são adequados em produção
2. **Adicionar mais índices**: Se necessário, baseado em queries lentas identificadas
3. **Cache**: Considerar adicionar cache para queries frequentes
4. **Paginação**: Garantir que todas as listas grandes usam paginação

## Como Aplicar as Mudanças

1. **Backend**: As mudanças já estão aplicadas no código
2. **Banco de Dados**: Execute a migração do Prisma para aplicar os novos índices:
   ```bash
   cd backend
   npx prisma migrate dev --name add_performance_indexes
   ```
3. **Teste**: Teste a geração de dados fictícios e o carregamento no mobile

## Notas Importantes

- Os timeouts foram aumentados para suportar conexões mais lentas, especialmente mobile
- Os batches maiores reduzem o número de queries, mas podem usar mais memória
- Se o banco de dados estiver em um serviço com limites (ex: Neon free tier), monitore o uso
