# 🔑 Como Configurar o .env.jira

Guia passo a passo para obter todas as informações necessárias para configurar o Jira Sync Agent.

## 📋 Informações Necessárias

Você precisa de 4 informações:
1. **JIRA_BASE_URL** - URL do seu Jira
2. **JIRA_EMAIL** - Seu email no Jira
3. **JIRA_API_TOKEN** - Token de API (precisa criar)
4. **JIRA_PROJECT_KEY** - Chave do projeto (ex: CLIN)

---

## 1️⃣ JIRA_BASE_URL

### O que é?
A URL base do seu Jira Cloud.

### Como obter?

**Opção A: Se você já tem acesso ao Jira**
- A URL geralmente é: `https://SEU-DOMINIO.atlassian.net`
- Exemplo: `https://minhaempresa.atlassian.net`
- Exemplo: `https://clinify.atlassian.net`

**Opção B: Se você não tem Jira ainda**
1. Acesse: https://www.atlassian.com/software/jira
2. Crie uma conta gratuita (até 10 usuários)
3. Escolha um nome para seu site (ex: `clinify`)
4. Sua URL será: `https://clinify.atlassian.net`

**Opção C: Verificar URL atual**
- Abra seu Jira no navegador
- A URL na barra de endereços é sua `JIRA_BASE_URL`
- Remova tudo depois de `.net` (ex: `https://seu-projeto.atlassian.net`)

---

## 2️⃣ JIRA_EMAIL

### O que é?
O email da sua conta Atlassian (usado para fazer login no Jira).

### Como obter?
- É simplesmente o email que você usa para fazer login no Jira
- Exemplo: `seu-email@gmail.com`
- Exemplo: `bruno@clinify.com`

**Onde verificar:**
1. Faça login no Jira
2. Clique no seu avatar (canto superior direito)
3. Vá em "Account settings" ou "Configurações da conta"
4. Seu email estará lá

---

## 3️⃣ JIRA_API_TOKEN

### O que é?
Um token de segurança que permite ao agente acessar o Jira via API.

### Como criar? (PASSO A PASSO)

1. **Acesse a página de API Tokens:**
   - Vá para: https://id.atlassian.com/manage-profile/security/api-tokens
   - Ou: https://id.atlassian.com → Security → API tokens

2. **Faça login** com sua conta Atlassian (mesmo email do Jira)

3. **Criar novo token:**
   - Clique no botão **"Create API token"**
   - Dê um nome descritivo (ex: "Clinify Sync Agent")
   - Clique em **"Create"**

4. **Copiar o token:**
   - ⚠️ **IMPORTANTE**: Você só verá o token UMA VEZ!
   - Copie o token imediatamente
   - Cole em um lugar seguro (você precisará dele)

5. **Formato do token:**
   - É uma string longa de caracteres
   - Exemplo: `ATATT3xFfGF0...` (muito mais longo)

**⚠️ Dica de Segurança:**
- Não compartilhe este token
- Se perder, crie um novo
- Você pode ter múltiplos tokens

---

## 4️⃣ JIRA_PROJECT_KEY

### O que é?
A chave (sigla) do projeto no Jira onde as issues serão criadas.

### Como obter?

**Opção A: Se o projeto já existe**
1. Abra seu Jira
2. Vá para o projeto desejado
3. Olhe a URL ou o nome do projeto
4. A chave geralmente aparece assim:
   - Na URL: `https://seu-projeto.atlassian.net/browse/CLIN-123`
   - `CLIN` é a chave do projeto
   - No nome: "CLIN - Clinify Project"
   - `CLIN` é a chave

**Opção B: Criar um novo projeto**
1. No Jira, clique em "Projects" → "Create project"
2. Escolha um template (ex: "Scrum" ou "Kanban")
3. Dê um nome (ex: "Clinify")
4. Escolha uma chave (ex: "CLIN")
5. Clique em "Create"

**Formato da chave:**
- Geralmente 2-10 letras maiúsculas
- Exemplos: `CLIN`, `PROJ`, `DEV`, `FEAT`
- Não pode ter espaços ou caracteres especiais

---

## 📝 Exemplo Completo

Depois de obter todas as informações, seu arquivo `.env.jira` ficará assim:

```env
# URL base do seu Jira
JIRA_BASE_URL=https://clinify.atlassian.net

# Email da sua conta
JIRA_EMAIL=bruno@clinify.com

# API Token (obtido em https://id.atlassian.com/manage-profile/security/api-tokens)
JIRA_API_TOKEN=ATATT3xFfGF0k7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2

# Chave do projeto (aparece nas issues, ex: CLIN-123)
JIRA_PROJECT_KEY=CLIN
```

---

## ✅ Verificar se está correto

Depois de configurar, teste com:

```bash
# Ver o que será analisado (não precisa do Jira)
npm run jira:analyze

# Testar conexão (simula sem criar issues)
npm run jira:dry-run
```

Se aparecer erros de autenticação:
- Verifique se o email está correto
- Verifique se o token foi copiado completamente
- Verifique se a URL está correta (sem barra no final)

---

## 🆘 Problemas Comuns

### Erro: "Unauthorized"
- ✅ Verifique se o email está correto
- ✅ Verifique se o token foi copiado completamente (sem espaços)
- ✅ Certifique-se de que o token não expirou (crie um novo se necessário)

### Erro: "Project not found"
- ✅ Verifique se a chave do projeto está correta (maiúsculas)
- ✅ Verifique se você tem acesso ao projeto
- ✅ Tente acessar o projeto no navegador primeiro

### Erro: "Invalid URL"
- ✅ A URL não deve ter barra no final
- ✅ Deve começar com `https://`
- ✅ Deve terminar com `.atlassian.net`

---

## 🔗 Links Úteis

- **Criar API Token**: https://id.atlassian.com/manage-profile/security/api-tokens
- **Gerenciar Projetos**: https://seu-projeto.atlassian.net/jira/projects
- **Documentação Jira API**: https://developer.atlassian.com/cloud/jira/platform/rest/v3/

---

## 📞 Precisa de Ajuda?

Se ainda tiver dúvidas:
1. Verifique se consegue fazer login no Jira no navegador
2. Verifique se tem permissão para criar issues no projeto
3. Tente criar uma issue manualmente no Jira primeiro
4. Se funcionar manualmente, o agente também deve funcionar

---

## 🔄 Registro Automático de Mudanças no Código

O Jira Sync Agent agora pode registrar automaticamente todas as mudanças que você fizer no código!

### Como Funciona

O sistema detecta mudanças usando Git e cria/atualiza issues no Jira automaticamente, agrupando mudanças por categoria (componentes, rotas, serviços, etc.).

### Uso Manual

**Registrar mudanças desde o último commit:**
```bash
npm run jira:register-changes
```

**Registrar mudanças de um commit específico:**
```bash
npm run jira:register-changes HEAD~1
```

**Comparar dois commits:**
```bash
npm run jira:register-changes abc123 def456
```

**Registrar apenas arquivos staged (antes de commitar):**
```bash
# Primeiro, adicione arquivos ao stage
git add .

# Depois registre as mudanças
npm run jira:register-changes
```

### Configuração Automática (Hook do Git)

Para registrar mudanças automaticamente após cada commit:

1. **Configure o hook:**
```bash
chmod +x scripts/setup-jira-hook.sh
./scripts/setup-jira-hook.sh
```

2. **Pronto!** Agora, sempre que você fizer um commit, as mudanças serão registradas automaticamente no Jira.

**Para desativar o hook:**
```bash
rm .git/hooks/post-commit
```

### O que é Registrado?

- ✅ Arquivos modificados, adicionados ou deletados
- ✅ Número de linhas adicionadas/removidas
- ✅ Categoria da mudança (Dashboard, API, Serviços, etc.)
- ✅ Informações do commit (hash, mensagem)
- ✅ Data e hora da mudança

### Exemplo de Issue Criada

Quando você fizer mudanças, uma issue será criada no Jira com:

- **Título:** `🔄 Mudanças: Dashboard - Financeiro`
- **Descrição:** Detalhes das mudanças, arquivos afetados, estatísticas
- **Labels:** `clinify`, `mudanças-código`, `dashboard`, etc.
- **Status:** Feita (já que o código foi modificado)

### Agrupamento Inteligente

O sistema agrupa mudanças por categoria:
- Se você modificar vários arquivos do Dashboard, cria 1 issue
- Se modificar arquivos de categorias diferentes, cria issues separadas
- Se atualizar a mesma categoria em menos de 24h, adiciona comentário na issue existente

### Dicas

1. **Commite frequentemente** para ter um histórico detalhado
2. **Use mensagens de commit descritivas** - elas aparecem nas issues
3. **O hook é opcional** - você pode usar apenas o comando manual se preferir
4. **Arquivos ignorados** (node_modules, dist, etc.) não são rastreados

