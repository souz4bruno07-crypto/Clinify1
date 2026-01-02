# 📋 Resumo Rápido - Configuração Jira

## 🎯 4 Informações que Você Precisa

| Item | Onde Encontrar | Exemplo |
|------|----------------|---------|
| **JIRA_BASE_URL** | URL quando acessa o Jira | `https://clinify.atlassian.net` |
| **JIRA_EMAIL** | Email de login no Jira | `seu-email@gmail.com` |
| **JIRA_API_TOKEN** | Criar em: https://id.atlassian.com/manage-profile/security/api-tokens | `ATATT3xFfGF0...` |
| **JIRA_PROJECT_KEY** | Chave do projeto (ex: CLIN-123) | `CLIN` |

---

## ⚡ Passo a Passo Rápido

### 1. Criar arquivo de configuração
```bash
cp scripts/env.jira.example .env.jira
```

### 2. Obter API Token (mais importante!)
1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em **"Create API token"**
3. Dê um nome: "Clinify Sync Agent"
4. **Copie o token** (você só verá uma vez!)

### 3. Preencher .env.jira
```env
JIRA_BASE_URL=https://seu-projeto.atlassian.net
JIRA_EMAIL=seu-email@exemplo.com
JIRA_API_TOKEN=seu-token-copiado-aqui
JIRA_PROJECT_KEY=CLIN
```

### 4. Testar
```bash
npm run jira:analyze    # Ver o que será analisado
npm run jira:dry-run    # Testar sem criar issues
npm run jira:sync       # Sincronizar com Jira
```

---

## 🔗 Links Importantes

- **Criar API Token**: https://id.atlassian.com/manage-profile/security/api-tokens
- **Guia Completo**: `scripts/COMO_CONFIGURAR_JIRA.md`
- **Quick Start**: `scripts/QUICK_START.md`

---

## ❓ Dúvidas?

Consulte o guia completo: `scripts/COMO_CONFIGURAR_JIRA.md`



