# 🔧 Clinify Jira Sync Agent

Agente automatizado que analisa o projeto Clinify e sincroniza todas as implementações com o Jira, organizando por status (Analisando, Em Teste, Feita).

## 🚀 Funcionalidades

- ✅ **Análise Completa do Código**
  - Componentes React (frontend)
  - Rotas da API (backend)
  - Serviços e integrações
  - Detecção automática de features

- ✅ **Detecção Inteligente**
  - Identifica TODOs e FIXMEs
  - Detecta bugs potenciais
  - Analisa dependências
  - Calcula métricas de código

- ✅ **Integração com Jira**
  - Cria issues automaticamente
  - Atualiza issues existentes
  - Organiza por status e categoria
  - Adiciona labels e prioridades

- ✅ **Rastreamento Git**
  - Associa mudanças recentes
  - Identifica autor e data
  - Enriquece informações das issues

- ✅ **Relatórios e Exportação**
  - Gera relatórios completos
  - Exporta dados para JSON
  - Estatísticas do projeto

## 📋 Pré-requisitos

1. **Node.js 18+** instalado
2. **Conta no Jira** com acesso ao projeto
3. **API Token do Jira** (veja como obter abaixo)

## 🔑 Como Obter o API Token do Jira

1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em **"Create API token"**
3. Dê um nome descritivo (ex: "Clinify Sync Agent")
4. Copie o token gerado (você só verá ele uma vez!)

## ⚙️ Configuração

### 1. Criar arquivo de configuração

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.jira.example .env.jira
```

Edite o arquivo `.env.jira`:

```env
JIRA_BASE_URL=https://seu-projeto.atlassian.net
JIRA_EMAIL=seu-email@exemplo.com
JIRA_API_TOKEN=seu-api-token-aqui
JIRA_PROJECT_KEY=CLIN
```

### 2. Instalar dependências

```bash
npm install
```

## 🎯 Como Usar

### Comandos Disponíveis

#### 1. Analisar o projeto (sem enviar ao Jira)

```bash
npm run jira:analyze
```

Lista todas as implementações encontradas organizadas por status.

#### 2. Simular sincronização (dry-run)

```bash
npm run jira:dry-run
```

Mostra o que seria enviado ao Jira sem criar issues de verdade.

#### 3. Sincronizar com Jira

```bash
npm run jira:sync
```

Analisa o projeto e cria/atualiza issues no Jira.

#### 4. Gerar relatório

```bash
npm run jira:report
```

Gera um relatório completo com estatísticas do projeto.

#### 5. Exportar para JSON

```bash
npm run jira:export
```

Exporta todas as implementações para um arquivo JSON.

## 📊 O que o Agente Detecta

### Implementações Identificadas

- **Componentes React**: Dashboard, PEP, Prescrições, CRM, etc.
- **Rotas da API**: Endpoints REST completos
- **Serviços**: Integrações com APIs externas
- **Integrações**: Stripe, Mercado Pago, Gemini AI, etc.

### Status Detectados

- **Analisando Implementação**: Código com TODOs, bugs ou incompleto
- **Em Teste**: Código com testes associados
- **Feita**: Implementação completa e funcional

### Categorias

- Componentes Core
- Backend API
- Serviços
- Integrações
- Melhorias
- Bugs

## 🔍 Exemplo de Uso

```bash
# 1. Primeiro, analise o projeto
npm run jira:analyze

# 2. Veja o que será enviado (dry-run)
npm run jira:dry-run

# 3. Sincronize com o Jira
npm run jira:sync

# 4. Gere um relatório
npm run jira:report
```

## 📝 Estrutura das Issues no Jira

Cada issue criada contém:

- **Título**: `[Clinify] Nome da Implementação`
- **Descrição**: Detalhes completos da implementação
- **Tipo**: Story, Task, Epic, Bug, Improvement
- **Labels**: clinify, categoria, tipo, status
- **Prioridade**: Baseada em bugs e TODOs encontrados
- **Arquivos**: Lista de arquivos relacionados
- **TODOs/Bugs**: Lista de itens pendentes encontrados
- **Dependências**: Bibliotecas e módulos utilizados

## 🛠️ Personalização

### Mapeamento de Tipos de Issue

Você pode personalizar o mapeamento de tipos editando o código:

```typescript
issueTypeMap: {
  'feature': 'Story',
  'component': 'Task',
  'route': 'Task',
  'service': 'Task',
  'integration': 'Epic',
  'bug': 'Bug',
  'improvement': 'Improvement'
}
```

### Mapeamento de Status

```typescript
statusMap: {
  'analisando': 'Analisando Implementação',
  'em-teste': 'Em Teste',
  'feita': 'Feita'
}
```

## 🐛 Troubleshooting

### Erro: "Configuração do Jira não encontrada"

Certifique-se de que o arquivo `.env.jira` existe na raiz do projeto e está preenchido corretamente.

### Erro: "Jira API error: Unauthorized"

- Verifique se o email está correto
- Confirme que o API token está válido
- Verifique se você tem permissão no projeto Jira

### Erro: "Project not found"

Verifique se a chave do projeto (`JIRA_PROJECT_KEY`) está correta. Ela geralmente é uma sigla em maiúsculas (ex: CLIN, PROJ).

### Issues duplicadas

O agente tenta evitar duplicatas procurando por issues existentes com o mesmo título. Se ainda assim criar duplicatas, você pode fechar manualmente no Jira.

## 📈 Estatísticas Coletadas

O agente coleta as seguintes métricas:

- Total de arquivos analisados
- Total de linhas de código
- Número de componentes
- Número de rotas API
- Número de serviços
- Número de integrações
- Quantidade de TODOs
- Quantidade de bugs encontrados

## 🔄 Atualização de Issues

O agente é inteligente e:

- Procura issues existentes antes de criar novas
- Atualiza issues existentes com informações mais recentes
- Mantém o histórico no Jira

## 📚 Recursos Adicionais

- [Documentação da API do Jira](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Como criar API tokens](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)

## 🤝 Contribuindo

Sinta-se à vontade para melhorar o agente! Algumas ideias:

- Adicionar suporte a outros sistemas (Linear, GitHub Issues)
- Melhorar detecção de bugs
- Adicionar análise de performance
- Integração com CI/CD

## 📄 Licença

Este agente faz parte do projeto Clinify.

---

**Desenvolvido com ❤️ para o Clinify**


