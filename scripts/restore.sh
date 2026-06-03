#!/bin/bash
# ============================================================
# restore.sh — Restauración de backup MongoDB
# Uso: ./scripts/restore.sh gotagota_backup_20260101_020000.tar.gz
# ============================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/gotagota}"
MONGO_CONTAINER="gotagota_mongodb"
MONGO_DB="gotagota"
MONGO_USER="${MONGO_ROOT_USER:-root}"
MONGO_PASS="${MONGO_ROOT_PASSWORD:-rootpassword}"

if [ -z "${1:-}" ]; then
  echo "❌ Uso: $0 <nombre_backup.tar.gz>"
  echo ""
  echo "Backups disponibles:"
  ls "${BACKUP_DIR}"/gotagota_backup_*.tar.gz 2>/dev/null || echo "  (ninguno)"
  exit 1
fi

BACKUP_FILE="${BACKUP_DIR}/$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Archivo no encontrado: ${BACKUP_FILE}"
  exit 1
fi

echo "⚠️  ADVERTENCIA: Esto reemplazará la base de datos '${MONGO_DB}'"
read -p "¿Continuar? (escribir 'SI' para confirmar): " CONFIRM

if [ "${CONFIRM}" != "SI" ]; then
  echo "❌ Operación cancelada"
  exit 0
fi

TEMP_DIR="/tmp/gotagota_restore_$(date +%s)"
mkdir -p "${TEMP_DIR}"

echo "📦 Descomprimiendo backup..."
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

DUMP_DIR=$(find "${TEMP_DIR}" -type d -name "gotagota*" | head -1)

echo "📤 Copiando al contenedor..."
docker cp "${DUMP_DIR}" "${MONGO_CONTAINER}:/tmp/restore_dump"

echo "🔄 Restaurando base de datos..."
docker exec "${MONGO_CONTAINER}" mongorestore \
  --username="${MONGO_USER}" \
  --password="${MONGO_PASS}" \
  --authenticationDatabase=admin \
  --db="${MONGO_DB}" \
  --drop \
  --gzip \
  "/tmp/restore_dump"

docker exec "${MONGO_CONTAINER}" rm -rf /tmp/restore_dump
rm -rf "${TEMP_DIR}"

echo "✅ Restauración completada exitosamente"
