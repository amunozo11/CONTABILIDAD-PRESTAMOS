#!/bin/bash
# ============================================================
# backup.sh — Backup automático de MongoDB
# GotaGota | Hostinger VPS Ubuntu
# Cron: 0 2 * * * /opt/gotagota/scripts/backup.sh
# ============================================================

set -euo pipefail

# ─── Configuración ───────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/gotagota}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="gotagota_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# MongoDB config (desde docker-compose)
MONGO_CONTAINER="gotagota_mongodb"
MONGO_DB="gotagota"
MONGO_USER="${MONGO_ROOT_USER:-root}"
MONGO_PASS="${MONGO_ROOT_PASSWORD:-rootpassword}"

# ─── Funciones ───────────────────────────────────────────────
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# ─── Inicio ──────────────────────────────────────────────────
log "🚀 Iniciando backup: ${BACKUP_NAME}"

# Crear directorio si no existe
mkdir -p "${BACKUP_DIR}"

# ─── Dump MongoDB ─────────────────────────────────────────────
log "📦 Ejecutando mongodump..."
docker exec "${MONGO_CONTAINER}" mongodump \
  --username="${MONGO_USER}" \
  --password="${MONGO_PASS}" \
  --authenticationDatabase=admin \
  --db="${MONGO_DB}" \
  --out="/tmp/${BACKUP_NAME}" \
  --gzip

# Copiar desde el contenedor al host
docker cp "${MONGO_CONTAINER}:/tmp/${BACKUP_NAME}" "${BACKUP_PATH}"

# Limpiar temporal en el contenedor
docker exec "${MONGO_CONTAINER}" rm -rf "/tmp/${BACKUP_NAME}"

log "✅ Dump completado en: ${BACKUP_PATH}"

# ─── Comprimir ────────────────────────────────────────────────
log "🗜️  Comprimiendo backup..."
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_PATH}"

log "✅ Comprimido: ${BACKUP_PATH}.tar.gz"

# ─── Calcular tamaño ──────────────────────────────────────────
SIZE=$(du -sh "${BACKUP_PATH}.tar.gz" | cut -f1)
log "📊 Tamaño del backup: ${SIZE}"

# ─── Limpiar backups antiguos ─────────────────────────────────
log "🧹 Limpiando backups con más de ${RETENTION_DAYS} días..."
find "${BACKUP_DIR}" -name "gotagota_backup_*.tar.gz" \
  -mtime "+${RETENTION_DAYS}" -delete

REMAINING=$(ls "${BACKUP_DIR}"/gotagota_backup_*.tar.gz 2>/dev/null | wc -l)
log "📁 Backups actuales en disco: ${REMAINING}"

log "🎉 Backup completado exitosamente: ${BACKUP_NAME}.tar.gz (${SIZE})"
