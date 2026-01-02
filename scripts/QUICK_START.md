# 🚀 Quick Start - Jira Sync Agent

Guia rápido para começar a usar o Jira Sync Agent em 5 minutos.

## 1️⃣ Setup Rápido

```bash
# Executar script de setup
chmod +x scripts/setup-jira-sync.sh
./scripts/setup-jira-sync.sh
```

Ou manualmente:

```bash
# Instalar dependências
npm install

# Criar arquivo de configuração
cp scripts/env.jira.example .env.jira
```

## 2️⃣ Obter API Token do Jira

1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em **"Create API token"**
3. Copie o token gerado

## 3️⃣ Configurar Credenciais

Edite o arquivo `.env.jira` na raiz do projeto:

```env
JIRA_BASE_URL=https://seu-projeto.atlassian.net
JIRA_EMAIL=seu-email@exemplo.com
JIRA_API_TOKEN=seu-token-aqui
JIRA_PROJECT_KEY=CLIN
```

## 4️⃣ Testar

```bash
# Ver o que será analisado
npm run jira:analyze

# Simular envio (sem criar issues)
npm run jira:dry-run

# Sincronizar com Jira
npm run jira:sync
```

## 📋 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run jira:analyze` | Analisa o projeto e lista implementações |
| `npm run jira:dry-run` | Simula sincronização sem criar issues |
| `npm run jira:sync` | Sincroniza com o Jira (cria/atualiza issues) |
| `npm run jira:report` | Gera relatório completo do projeto |
| `npm run jira:export` | Exporta dados para JSON |

## 🎯 O que o Agente Faz?

- ✅ Analisa todos os componentes React
- ✅ Identifica rotas da API
- ✅ Detecta serviços e integrações
- ✅ Encontra TODOs e bugs
- ✅ Cria issues no Jira organizadas por status
- ✅ Atualiza issues existentes

## 🔍 Status das Issues

- **Analisando Implementação**: Código com TODOs ou incompleto
- **Em Teste**: Código com testes
- **Feita**: Implementação completa

## ❓ Problemas?

Consulte a documentação completa: `scripts/JIRA_SYNC_README.md`



