# 📤 Comandos para Fazer Push para GitHub e GitLab

## 🔄 Situação Atual
- **Remote GitHub**: `origin` → https://github.com/souz4bruno07-crypto/Clinify1.git
- **Remote GitLab**: `gitlab` → https://gitlab.com/arco288/clinify-backend.git
- **Branch**: `main`

## 📝 Passo 1: Adicionar as mudanças ao staging

```bash
git add .
```

Ou adicionar arquivos específicos:

```bash
git add backend/api/index.js
git add backend/vercel.json
git add backend/COMO_RESOLVER_ERRO_VERCEL.md
git add backend/package.json
git add backend/package-lock.json
```

## 💾 Passo 2: Fazer commit das mudanças

```bash
git commit -m "fix: corrigir erro 500 no Vercel - melhorar handler e configuração"
```

Ou com mensagem mais detalhada:

```bash
git commit -m "fix: corrigir erro 500 no Vercel

- Melhorar handler do Vercel (api/index.js) com logs e tratamento de erros
- Corrigir configuração do vercel.json
- Adicionar guia de resolução de problemas (COMO_RESOLVER_ERRO_VERCEL.md)
- Atualizar scripts de build"
```

## 🔄 Passo 3: Atualizar branch local (se necessário)

Antes de fazer push, pode ser necessário atualizar do GitLab:

```bash
git pull gitlab main
```

## 🚀 Passo 4: Fazer push para ambos os repositórios

### Opção A: Push para ambos de uma vez
```bash
git push origin main && git push gitlab main
```

### Opção B: Push separado (mais seguro)
```bash
# Push para GitHub
git push origin main

# Push para GitLab
git push gitlab main
```

## 📋 Comandos Completos (Sequência Completa)

```bash
# 1. Adicionar mudanças
git add .

# 2. Fazer commit
git commit -m "fix: corrigir erro 500 no Vercel - melhorar handler e configuração"

# 3. Push para GitHub
git push origin main

# 4. Push para GitLab
git push gitlab main
```

## ⚠️ Se houver conflitos

Se o `git pull gitlab main` mostrar conflitos:

```bash
# Ver conflitos
git status

# Resolver conflitos manualmente nos arquivos
# Depois:
git add .
git commit -m "merge: resolver conflitos com gitlab/main"
git push origin main
git push gitlab main
```

## 🔍 Verificar status antes de fazer push

```bash
# Ver mudanças pendentes
git status

# Ver diferenças
git diff

# Ver commits que serão enviados
git log gitlab/main..HEAD
```

---

**Nota**: Se precisar configurar autenticação, use:
- GitHub: Personal Access Token
- GitLab: Personal Access Token ou SSH
