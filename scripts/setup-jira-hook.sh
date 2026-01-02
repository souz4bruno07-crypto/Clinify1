#!/bin/bash
#
# Script para configurar o hook do Git que registra mudanças automaticamente no Jira
#

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$PROJECT_ROOT" ]; then
  echo "❌ Erro: Este diretório não é um repositório Git!"
  echo "   Execute: git init"
  exit 1
fi

HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
POST_COMMIT_HOOK="$HOOKS_DIR/post-commit"
SCRIPT_HOOK="$PROJECT_ROOT/scripts/git-hooks/post-commit"

if [ ! -f "$SCRIPT_HOOK" ]; then
  echo "❌ Erro: Arquivo do hook não encontrado: $SCRIPT_HOOK"
  exit 1
fi

# Criar diretório de hooks se não existir
mkdir -p "$HOOKS_DIR"

# Copiar hook
cp "$SCRIPT_HOOK" "$POST_COMMIT_HOOK"
chmod +x "$POST_COMMIT_HOOK"

echo "✅ Hook do Git configurado com sucesso!"
echo ""
echo "📝 O hook irá registrar automaticamente mudanças no Jira após cada commit."
echo "💡 Para desativar, remova o arquivo: .git/hooks/post-commit"
echo ""


