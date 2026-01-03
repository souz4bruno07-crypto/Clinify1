# 🔄 Registro Automático de Mudanças no Código

Este guia explica como usar a funcionalidade de registro automático de mudanças no código no Jira.

## 🎯 O que faz?

Quando você modifica o código, o sistema:
1. Detecta as mudanças usando Git
2. Analisa quais arquivos foram modificados
3. Agrupa mudanças por categoria (Dashboard, API, Serviços, etc.)
4. Cria ou atualiza issues no Jira automaticamente

## 🚀 Como Usar

### Opção 1: Manual (Recomendado para começar)

Execute o comando após fazer mudanças:

```bash
# Registra mudanças desde o último commit
npm run jira:register-changes
```

### Opção 2: Automático (Hook do Git)

Configure para registrar automaticamente após cada commit:

```bash
# Configurar hook (apenas uma vez)
npm run jira:setup-hook
```

Agora, sempre que você fizer um commit, as mudanças serão registradas automaticamente!

## 📋 Exemplos de Uso

### Registrar mudanças do último commit
```bash
npm run jira:register-changes HEAD~1
```

### Comparar dois commits específicos
```bash
npm run jira:register-changes abc123 def456
```

### Registrar mudanças staged (antes de commitar)
```bash
git add .
npm run jira:register-changes
```

## 📊 O que é Registrado?

Cada issue criada contém:

- ✅ **Arquivos modificados** - Lista completa de arquivos alterados
- ✅ **Estatísticas** - Linhas adicionadas/removidas
- ✅ **Categoria** - Agrupamento inteligente (Dashboard, API, etc.)
- ✅ **Commit** - Hash e mensagem do commit
- ✅ **Data/Hora** - Quando a mudança foi feita

## 🏷️ Agrupamento Inteligente

O sistema agrupa mudanças automaticamente:

| Mudanças em | Issue Criada |
|------------|--------------|
| Vários arquivos do Dashboard | 1 issue: "Mudanças: Dashboard" |
| Arquivos de API | 1 issue: "Mudanças: API - Users" |
| Arquivos de serviços | 1 issue: "Mudanças: Serviço - AI" |
| Categorias diferentes | Issues separadas |

**Atualização automática:** Se você modificar a mesma categoria em menos de 24h, o sistema adiciona um comentário na issue existente ao invés de criar uma nova.

## 🎨 Exemplo de Issue

Quando você modifica código, uma issue é criada assim:

**Título:**
```
🔄 Mudanças: Dashboard - Financeiro
```

**Descrição:**
```
🔄 Mudanças no Código - Dashboard - Financeiro

Mudanças detectadas:
• 2 arquivo(s) adicionado(s)
• 5 arquivo(s) modificado(s)
• 0 arquivo(s) deletado(s)
• 234 linha(s) adicionada(s)
• 45 linha(s) removida(s)

📅 Data: 15/01/2024 14:30:00
🔖 Commit: a1b2c3d
💬 Mensagem: Adiciona gráficos financeiros

📂 Arquivos Relacionados:
• components/dashboard/finance/Charts.tsx
• components/dashboard/finance/Reports.tsx
...
```

**Labels:** `clinify`, `mudanças-código`, `dashboard`, `improvement`, `feita`

## ⚙️ Configuração

### Pré-requisitos

1. **Repositório Git inicializado:**
```bash
git init
```

2. **Arquivo .env.jira configurado:**
```bash
# Veja scripts/COMO_CONFIGURAR_JIRA.md
cp scripts/env.jira.example .env.jira
# Edite .env.jira com suas credenciais
```

### Ativar Hook Automático

```bash
npm run jira:setup-hook
```

### Desativar Hook

```bash
rm .git/hooks/post-commit
```

## 🔍 Detalhes Técnicos

### Arquivos Rastreados

O sistema rastreia apenas arquivos relevantes:
- ✅ `.ts`, `.tsx`, `.js`, `.jsx` (código)
- ✅ `.json` (configurações)
- ✅ `.css` (estilos)
- ✅ `.prisma` (schema do banco)

### Arquivos Ignorados

Estes arquivos são ignorados:
- ❌ `node_modules/`
- ❌ `dist/`, `build/`
- ❌ `.env*`
- ❌ `package-lock.json`, `yarn.lock`
- ❌ `.log`
- ❌ `.md` (documentação)

### Categorias Detectadas

O sistema identifica automaticamente:

- **Dashboard** - Componentes em `components/dashboard/`
- **PEP** - Prontuário Eletrônico
- **Prescrições** - Sistema de prescrições
- **CRM** - Sistema de CRM
- **API** - Rotas do backend
- **Serviços** - Serviços em `services/`
- **Banco de Dados** - Arquivos Prisma
- **Hooks/Contextos** - React hooks e contexts
- **Utilitários** - Funções utilitárias

## 🆘 Problemas Comuns

### "Este diretório não é um repositório Git"
```bash
git init
git add .
git commit -m "Initial commit"
```

### "Nenhuma mudança detectada"
- Verifique se você fez commit das mudanças
- Ou use `git add .` para adicionar arquivos ao stage
- Execute `npm run jira:register-changes` novamente

### "Configuração do Jira não encontrada"
- Crie o arquivo `.env.jira` na raiz do projeto
- Veja `scripts/COMO_CONFIGURAR_JIRA.md` para detalhes

### Hook não executa automaticamente
- Verifique se o hook existe: `ls -la .git/hooks/post-commit`
- Verifique permissões: `chmod +x .git/hooks/post-commit`
- Execute o setup novamente: `npm run jira:setup-hook`

## 💡 Dicas

1. **Commite frequentemente** - Facilita o rastreamento
2. **Mensagens de commit descritivas** - Aparecem nas issues
3. **Use o hook automático** - Economiza tempo
4. **Revise as issues criadas** - Ajuste labels/prioridades se necessário

## 📚 Mais Informações

- **Configuração do Jira:** `scripts/COMO_CONFIGURAR_JIRA.md`
- **Todos os comandos:** Execute `npm run jira:help` ou veja o código em `scripts/jira-sync-agent.ts`




