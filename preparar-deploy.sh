#!/bin/bash

# Script para preparar o projeto Clinify para deploy no Vercel
# Uso: ./preparar-deploy.sh

set -e

echo "🚀 Preparando Clinify para deploy no Vercel..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto Clinify${NC}"
    exit 1
fi

# 1. Remover arquivos sensíveis do staged
echo -e "${YELLOW}📝 Removendo arquivos sensíveis do staged...${NC}"
git restore --staged .env backend/.env 2>/dev/null || true
echo -e "${GREEN}✅ Arquivos .env removidos do staged${NC}"
echo ""

# 2. Verificar se .env está no .gitignore
if grep -q "^\.env$" .gitignore && grep -q "^backend/\.env$" .gitignore; then
    echo -e "${GREEN}✅ .gitignore configurado corretamente${NC}"
else
    echo -e "${YELLOW}⚠️  Verifique se .env está no .gitignore${NC}"
fi
echo ""

# 3. Verificar status do Git
echo -e "${YELLOW}📊 Status atual do Git:${NC}"
git status --short | head -20
echo ""

# 4. Perguntar se deseja adicionar todos os arquivos
read -p "Deseja adicionar todos os arquivos ao Git? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}📦 Adicionando arquivos...${NC}"
    git add .
    echo -e "${GREEN}✅ Arquivos adicionados${NC}"
    echo ""
    
    # 5. Perguntar sobre commit
    read -p "Deseja fazer commit agora? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        read -p "Mensagem do commit (ou Enter para usar padrão): " commit_msg
        if [ -z "$commit_msg" ]; then
            commit_msg="feat: preparação inicial para deploy no Vercel"
        fi
        git commit -m "$commit_msg"
        echo -e "${GREEN}✅ Commit realizado: $commit_msg${NC}"
        echo ""
    fi
fi

# 6. Verificar remotes
echo -e "${YELLOW}🔗 Verificando remotes configurados...${NC}"
if git remote -v | grep -q "origin"; then
    echo -e "${GREEN}✅ Remote 'origin' já configurado:${NC}"
    git remote -v
    echo ""
    
    read -p "Deseja fazer push agora? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        branch=$(git branch --show-current)
        echo -e "${YELLOW}📤 Fazendo push para origin/$branch...${NC}"
        git push -u origin "$branch"
        echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nenhum remote 'origin' configurado${NC}"
    echo ""
    echo "Para adicionar um remote, execute:"
    echo "  git remote add origin https://github.com/SEU-USUARIO/clinify.git"
    echo "  ou"
    echo "  git remote add origin https://gitlab.com/SEU-USUARIO/clinify.git"
    echo ""
fi

echo ""
echo -e "${GREEN}✨ Preparação concluída!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Crie um repositório no GitHub ou GitLab"
echo "2. Adicione o remote: git remote add origin <URL_DO_REPO>"
echo "3. Faça push: git push -u origin main"
echo "4. Importe o projeto no Vercel"
echo ""
echo "📖 Consulte o arquivo GUIA_DEPLOY_VERCEL.md para mais detalhes"



