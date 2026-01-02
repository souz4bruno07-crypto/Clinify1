#!/bin/bash
# Script para exportar variáveis de ambiente diretamente
# Execute: source exportar-variaveis.sh (ou . exportar-variaveis.sh)

export DATABASE_URL="postgresql://neondb_owner:npg_vqTjo86OfzmU@ep-steep-bar-accrl4m1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=20&pool_timeout=10"
export JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="
export FRONTEND_URL="http://localhost:5173"
export PORT=3001
export NODE_ENV="development"

echo "✅ Variáveis de ambiente exportadas!"
echo "Agora execute: npm run dev"


