# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências de build necessárias
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Definir DATABASE_URL temporária para Prisma generate (não precisa ser válida)
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"

# Instalar dependências (ignorar scripts para evitar problemas no postinstall)
RUN npm ci --ignore-scripts

# Copiar código fonte
COPY . .

# Gerar Prisma Client e compilar
RUN npm run db:generate && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar arquivos necessários
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Criar diretório de logs
RUN mkdir -p logs && chown nodejs:nodejs logs

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["node", "dist/index.js"]
