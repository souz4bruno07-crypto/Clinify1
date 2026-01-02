#!/bin/bash

# Script de setup para o Jira Sync Agent

echo "🔧 Configurando Jira Sync Agent para Clinify..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale npm primeiro."
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar arquivo .env.jira se não existir
ENV_FILE=".env.jira"
ENV_EXAMPLE="scripts/env.jira.example"

if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "📝 Criando arquivo de configuração..."
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo "✅ Arquivo $ENV_FILE criado a partir do exemplo."
        echo ""
        echo "⚠️  IMPORTANTE: Edite o arquivo $ENV_FILE e preencha com suas credenciais do Jira:"
        echo "   - JIRA_BASE_URL"
        echo "   - JIRA_EMAIL"
        echo "   - JIRA_API_TOKEN (obtenha em: https://id.atlassian.com/manage-profile/security/api-tokens)"
        echo "   - JIRA_PROJECT_KEY"
    else
        echo "⚠️  Arquivo de exemplo não encontrado. Criando arquivo vazio..."
        cat > "$ENV_FILE" << EOF
# Configuração do Jira Sync Agent
JIRA_BASE_URL=https://seu-projeto.atlassian.net
JIRA_EMAIL=seu-email@exemplo.com
JIRA_API_TOKEN=seu-api-token-aqui
JIRA_PROJECT_KEY=CLIN
EOF
        echo "✅ Arquivo $ENV_FILE criado. Por favor, preencha com suas credenciais."
    fi
else
    echo "✅ Arquivo $ENV_FILE já existe."
fi

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "📚 Próximos passos:"
echo "   1. Edite o arquivo .env.jira com suas credenciais"
echo "   2. Execute: npm run jira:analyze (para ver o que será enviado)"
echo "   3. Execute: npm run jira:dry-run (para simular)"
echo "   4. Execute: npm run jira:sync (para sincronizar com o Jira)"
echo ""
echo "💡 Para mais informações, consulte: scripts/JIRA_SYNC_README.md"
echo ""



