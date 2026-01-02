# ⚡ Quick Start: Deploy Rápido no Vercel

## 🎯 Resumo Rápido (3 passos)

### 1️⃣ Criar Repositório no GitHub/GitLab

**GitHub:**
- Acesse: https://github.com/new
- Nome: `clinify`
- ⚠️ **NÃO** marque "Initialize with README"
- Clique em "Create repository"
- **Copie a URL** (ex: `https://github.com/seu-usuario/clinify.git`)

**GitLab:**
- Acesse: https://gitlab.com/projects/new
- Nome: `clinify`
- ⚠️ **NÃO** marque "Initialize repository"
- Clique em "Create project"
- **Copie a URL** (ex: `https://gitlab.com/seu-usuario/clinify.git`)

---

### 2️⃣ Preparar e Enviar Código

**Opção A: Usar o script automático**
```bash
cd /Users/bruno.souza/Downloads/clinify
./preparar-deploy.sh
```

**Opção B: Manual**
```bash
cd /Users/bruno.souza/Downloads/clinify

# Adicionar arquivos (exceto .env)
git add .

# Commit
git commit -m "feat: preparação para deploy no Vercel"

# Adicionar remote (substitua pela sua URL)
git remote add origin https://github.com/SEU-USUARIO/clinify.git

# Push
git push -u origin main
```

---

### 3️⃣ Deploy no Vercel

1. Acesse: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `clinify`
4. Configure:
   - **Framework**: Vite (detecta automaticamente)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Adicione variáveis de ambiente (se necessário):
   - `VITE_API_URL` = URL do seu backend
6. Clique em **"Deploy"**
7. ✅ Pronto! Aguarde o build e acesse a URL gerada

---

## ⚙️ Configurações Importantes

### Variáveis de Ambiente no Vercel

Adicione no painel do Vercel (Settings → Environment Variables):

- `VITE_API_URL` = URL do backend em produção
- Outras variáveis que começam com `VITE_`

⚠️ **Lembre-se**: Apenas variáveis que começam com `VITE_` são expostas no frontend.

---

## 🐛 Problemas Comuns

**Erro: "Module not found"**
```bash
# Teste localmente primeiro
npm install
npm run build
```

**Erro: "Build failed"**
- Verifique os logs no Vercel
- Certifique-se de que todas as dependências estão no `package.json`

**Erro: "404 em rotas"**
- O `vercel.json` já está configurado ✅
- Se persistir, verifique se o arquivo está na raiz

---

## 📚 Documentação Completa

Para mais detalhes, consulte: **GUIA_DEPLOY_VERCEL.md**

---

## ✅ Checklist

- [ ] Repositório criado no GitHub/GitLab
- [ ] Código enviado (git push)
- [ ] Projeto importado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Aplicação funcionando

---

**🎉 Pronto! Seu Clinify está no ar!**


