# 🔧 Como Corrigir o Erro 404 no Login/Cadastro

## ❌ Problema Identificado:

O frontend está tentando acessar `http://localhost:3001/auth/signup` mas deveria ser `http://localhost:3001/api/auth/signup`.

O prefixo `/api` está faltando!

---

## ✅ Solução:

### Passo 1: Criar/Atualizar o arquivo `.env` na raiz do projeto

1. **Abra a pasta raiz** do projeto (não a pasta `backend/`)
2. **Crie ou edite o arquivo `.env`** (sem extensão)
3. **Adicione esta linha:**
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Salve o arquivo**

### Passo 2: Reiniciar o Frontend

**IMPORTANTE:** Depois de criar/editar o `.env`, você **DEVE reiniciar o servidor do frontend**:

1. **Pare o frontend** (Ctrl+C no terminal onde está rodando)
2. **Inicie novamente:**
   ```bash
   npm run dev
   ```

**⚠️ O Vite só carrega variáveis do `.env` quando inicia!** Se você não reiniciar, as mudanças não terão efeito.

---

## 🧪 Teste:

Depois de reiniciar o frontend:

1. **Tente criar uma conta novamente**
2. **O erro 404 deve desaparecer**
3. **A requisição deve ir para:** `http://localhost:3001/api/auth/signup` ✅

---

## 📋 Checklist:

- [ ] Arquivo `.env` criado na **raiz** do projeto (não em `backend/`)
- [ ] Conteúdo: `VITE_API_URL=http://localhost:3001/api`
- [ ] Frontend **reiniciado** após criar/editar o `.env`
- [ ] Backend está rodando em `http://localhost:3001`

---

## 🔍 Verificar se Funcionou:

Abra o console do navegador (F12) e veja as requisições:

**Antes (ERRADO):**
```
POST http://localhost:3001/auth/signup → 404
```

**Depois (CORRETO):**
```
POST http://localhost:3001/api/auth/signup → 201 (Created)
```

---

## 💡 Por que isso aconteceu?

O Vite (servidor do frontend) precisa da variável `VITE_API_URL` para saber onde está o backend. Se não estiver configurada, ele usa o padrão `http://localhost:3001/api`, mas se estiver configurada errada (sem o `/api`), ele usa o valor errado.

---

## 🆘 Ainda não funcionou?

1. **Verifique se o arquivo está na raiz:**
   ```bash
   ls -la .env
   ```
   (deve estar na mesma pasta que `package.json` do frontend)

2. **Verifique o conteúdo:**
   ```bash
   cat .env
   ```
   Deve mostrar: `VITE_API_URL=http://localhost:3001/api`

3. **Certifique-se de ter reiniciado o frontend** após criar o arquivo

4. **Verifique se o backend está rodando:**
   - Abra: http://localhost:3001/health
   - Deve aparecer: `{"status":"ok"}`

Me avise se ainda não funcionar! 🚀


