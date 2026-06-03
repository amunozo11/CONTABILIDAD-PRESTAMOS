FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Imagen de producción ────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache curl tzdata
ENV TZ=America/Bogota

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY ecosystem.config.js ./

# Instalar PM2 globalmente
RUN npm install -g pm2

RUN mkdir -p /var/log/gotagota /var/backups/gotagota

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
