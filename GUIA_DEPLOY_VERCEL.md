# 🚀 Guia Completo: Deploy do Clinify no Vercel

Este guia vai te ajudar a subir o projeto Clinify para o GitHub/GitLab e fazer o deploy no Vercel.

## 📋 Pré-requisitos

- ✅ Conta no Vercel (você já tem)
- ✅ Vercel integrado com GitHub (já configurado)
- ✅ Git instalado localmente
- ✅ Conta no GitHub ou GitLab

---

## 🔄 Passo 1: Preparar o Código Localmente

### 1.1 Verificar arquivos sensíveis

Certifique-se de que os arquivos `.env` estão no `.gitignore` (já estão configurados ✅).

### 1.2 Adicionar todas as mudanças ao Git

```bash
# Adicionar todos os arquivos (incluindo não rastreados)
git add .

# Verificar o que será commitado
git status
```

### 1.3 Fazer o commit inicial

```bash
git commit -m "feat: preparação inicial para deploy no Vercel"
```

---

## 📦 Passo 2: Criar Repositório no GitHub

### Opção A: Via Interface Web do GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito → **"New repository"**
3. Preencha:
   - **Repository name**: `clinify` (ou o nome que preferir)
   - **Description**: "Sistema de gestão clínica e financeira"
   - **Visibility**: Escolha **Private** ou **Public**
   - ⚠️ **NÃO** marque "Initialize with README" (já temos código)
4. Clique em **"Create repository"**
5. **Copie a URL do repositório** (ex: `https://github.com/seu-usuario/clinify.git`)

### Opção B: Via Interface Web do GitLab

1. Acesse [gitlab.com](https://gitlab.com) e faça login
2. Clique em **"New project"** ou **"Create project"**
3. Escolha **"Create blank project"**
4. Preencha:
   - **Project name**: `clinify`
   - **Visibility Level**: Escolha conforme preferir
   - ⚠️ **NÃO** marque "Initialize repository with a README"
5. Clique em **"Create project"**
6. **Copie a URL do repositório** (ex: `https://gitlab.com/seu-usuario/clinify.git`)

---

## 🔗 Passo 3: Conectar Repositório Local ao GitHub/GitLab

Execute os seguintes comandos no terminal (substitua a URL pela sua):

### Para GitHub:
```bash
cd /Users/bruno.souza/Downloads/clinify

# Adicionar o remote
git remote add origin https://github.com/SEU-USUARIO/clinify.git

# Verificar se foi adicionado
git remote -v
```

### Para GitLab:
```bash
cd /Users/bruno.souza/Downloads/clinify

# Adicionar o remote
git remote add origin https://gitlab.com/SEU-USUARIO/clinify.git

# Verificar se foi adicionado
git remote -v
```

---

## 📤 Passo 4: Fazer Push do Código

```bash
# Renomear branch para main (se necessário)
git branch -M main

# Fazer push do código
git push -u origin main
```

**Nota**: Se você usar autenticação via HTTPS, o GitHub/GitLab pode pedir suas credenciais. Se usar SSH, configure as chaves primeiro.

---

## ⚙️ Passo 5: Configurar o Projeto no Vercel

### 5.1 Importar Projeto

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New..."** → **"Project"**
3. Selecione o repositório `clinify` da lista
4. Clique em **"Import"**

### 5.2 Configurar Build Settings

O Vercel deve detectar automaticamente as configurações, mas verifique:

- **Framework Preset**: Vite (deve detectar automaticamente)
- **Root Directory**: `./` (raiz do projeto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5.3 Configurar Variáveis de Ambiente

⚠️ **IMPORTANTE**: Adicione todas as variáveis de ambiente necessárias:

1. Na seção **"Environment Variables"**, adicione todas as variáveis do seu `.env`
2. **NÃO** inclua valores sensíveis diretamente no código
3. Variáveis comuns que você pode precisar:
   - `VITE_API_URL` (URL do backend)
   - `VITE_SUPABASE_URL` (se usar Supabase)
   - `VITE_SUPABASE_ANON_KEY`
   - Outras variáveis que começam com `VITE_`

### 5.4 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. O Vercel vai gerar uma URL automática (ex: `clinify.vercel.app`)

---

## 🏗️ Passo 6: Configurar Backend (Opcional)

Se você tem um backend separado, você pode:

### Opção A: Deploy do Backend no Vercel também

1. Crie um projeto separado no Vercel para o backend
2. Configure:
   - **Root Directory**: `./backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Opção B: Deploy do Backend em outro serviço

- Railway
- Render
- Heroku
- AWS
- Outro serviço de sua preferência

**Lembre-se**: Atualize a variável `VITE_API_URL` no Vercel com a URL do backend em produção.

---

## 🔍 Passo 7: Verificar Deploy

1. Acesse a URL gerada pelo Vercel
2. Teste as funcionalidades principais
3. Verifique os logs no dashboard do Vercel se houver erros

---

## 🐛 Troubleshooting

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para garantir que está tudo ok

### Erro: "Build failed"
- Verifique os logs de build no Vercel
- Teste o build localmente: `npm run build`

### Erro: "Environment variables missing"
- Adicione todas as variáveis necessárias no painel do Vercel
- Lembre-se: apenas variáveis que começam com `VITE_` são expostas no frontend

### Erro: "404 on routes"
- O `vercel.json` já está configurado com rewrites ✅
- Se ainda assim der erro, verifique se o arquivo está na raiz do projeto

---

## 📝 Comandos Úteis

```bash
# Ver status do Git
git status

# Ver commits
git log --oneline

# Ver remotes configurados
git remote -v

# Atualizar código no repositório
git add .
git commit -m "sua mensagem"
git push origin main

# Verificar build localmente
npm run build
npm run preview
```

---

## ✅ Checklist Final

- [ ] Código commitado localmente
- [ ] Repositório criado no GitHub/GitLab
- [ ] Remote adicionado e código enviado
- [ ] Projeto importado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] Aplicação funcionando em produção

---

## 🎉 Pronto!

Seu projeto Clinify agora está no ar! 🚀

**Dica**: O Vercel faz deploy automático sempre que você fizer push na branch `main`. Basta fazer `git push` e o deploy acontece automaticamente!


