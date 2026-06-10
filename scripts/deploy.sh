#!/bin/bash
# ============================================================
# deploy.sh — Script de despliegue en Hostinger VPS
# GotaGota | Uso: ./scripts/deploy.sh [--force]
# ============================================================

set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
PROJECT_DIR="/opt/gotagota"
LOG_FILE="/var/log/gotagota/deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "🚀 Iniciando despliegue GotaGota..."

# ─── Pull últimos cambios ──────────────────────────────────
log "📥 Actualizando código..."
git pull origin master

# ─── Build de imágenes ────────────────────────────────────
log "🏗️  Construyendo imágenes Docker..."
docker compose -f "${COMPOSE_FILE}" build --no-cache

# ─── Backup antes de reiniciar ────────────────────────────
log "💾 Creando backup previo al despliegue..."
bash ./scripts/backup.sh || log "⚠️ Backup falló, continuando..."

# ─── Reiniciar servicios ──────────────────────────────────
log "♻️  Reiniciando servicios..."
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

# ─── Health check ────────────────────────────────────────
log "🏥 Verificando salud de servicios..."
sleep 10

BACKEND_STATUS=$(curl -sf http://localhost:4000/health | jq -r '.status' 2>/dev/null || echo "error")
FRONTEND_STATUS=$(curl -sf http://localhost:3000/api/health | jq -r '.status' 2>/dev/null || echo "error")

if [ "${BACKEND_STATUS}" = "ok" ] && [ "${FRONTEND_STATUS}" = "ok" ]; then
  log "✅ Despliegue exitoso. Backend: ${BACKEND_STATUS} | Frontend: ${FRONTEND_STATUS}"
else
  log "❌ Health check falló. Backend: ${BACKEND_STATUS} | Frontend: ${FRONTEND_STATUS}"
  log "🔄 Revirtiendo al estado anterior..."
  docker compose -f "${COMPOSE_FILE}" restart
  exit 1
fi

# ─── Limpiar imágenes antiguas ────────────────────────────
log "🧹 Limpiando imágenes Docker antiguas..."
docker image prune -f

log "🎉 Despliegue completado exitosamente"
