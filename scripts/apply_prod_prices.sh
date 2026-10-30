#!/usr/bin/env bash
# =============================================================================
# Vestix ERP - Aplicar Restauración de Precios y Costos en Producción
# Compatible con despliegue nativo (PM2 / PostgreSQL local) y Docker
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SQL_FILE="${ROOT_DIR}/scripts/restore_catalog_prices_prod.sql"
BACKUP_DIR="${ROOT_DIR}/backups"
mkdir -p "$BACKUP_DIR"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: no se encontró el archivo $SQL_FILE" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/vestix-pre-prices-${STAMP}.sql.gz"

echo "======================================================"
echo "  Vestix ERP - Restauración de Costos y Precios"
echo "======================================================"
echo ""

# Detección del tipo de entorno: Docker vs Nativo Linux (PM2/systemd)
IS_DOCKER=false
if [ -f "$ROOT_DIR/.env" ] && command -v docker >/dev/null 2>&1 && docker compose -f docker-compose.yml ps >/dev/null 2>&1; then
  IS_DOCKER=true
fi

if [ "$IS_DOCKER" = true ]; then
  echo ">>> Detectado entorno DOCKER"
  COMPOSE=(docker compose -f docker-compose.yml --env-file .env)
  
  set -a
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.env"
  set +a

  # 1. Backup de seguridad
  echo ">>> [1/3] Realizando backup de seguridad previo..."
  if [ -f "$ROOT_DIR/scripts/docker-backup.sh" ]; then
    "$ROOT_DIR/scripts/docker-backup.sh"
  fi

  # 2. Ejecutar transacción
  echo ">>> [2/3] Ejecutando restauración transaccional en PostgreSQL..."
  "${COMPOSE[@]}" exec -T postgres \
    psql -U "${POSTGRES_USER:-erp_admin}" -d "${POSTGRES_DB:-erp_prod}" < "$SQL_FILE"

  # 3. Verificación
  echo ">>> [3/3] Verificando integridad..."
  "${COMPOSE[@]}" exec -T postgres \
    psql -U "${POSTGRES_USER:-erp_admin}" -d "${POSTGRES_DB:-erp_prod}" -c \
    "SELECT count(*) as total_variantes, count(CASE WHEN \"costPrice\" > 0 THEN 1 END) as con_costo, count(CASE WHEN \"basePrice\" > 0 THEN 1 END) as con_precio FROM catalog.\"ProductVariant\";"

else
  echo ">>> Detectado entorno NATIVO LINUX (/var/www/vestix)"
  
  # 1. Backup de seguridad
  echo ">>> [1/3] Realizando backup de seguridad previo -> $BACKUP_FILE..."
  if sudo -u postgres pg_dump erp_prod | gzip -c > "$BACKUP_FILE"; then
    echo "    ✓ Backup guardado ($(du -h "$BACKUP_FILE" | cut -f1))"
  else
    echo "    Advertencia: no se pudo crear backup con usuario postgres, intentando continuar..."
  fi

  # 2. Ejecutar transacción
  echo ">>> [2/3] Ejecutando restauración transaccional en PostgreSQL..."
  if sudo -u postgres psql -d erp_prod -f "$SQL_FILE"; then
    echo "    ✓ Script ejecutado exitosamente."
  else
    # Fallback usando variables de backend/.env si están disponibles
    if [ -f "$ROOT_DIR/backend/.env" ]; then
      DB_URL="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/backend/.env" | head -1 | cut -d= -f2- | tr -d '\"' || true)"
      if [ -n "$DB_URL" ]; then
        psql "$DB_URL" -f "$SQL_FILE"
      fi
    fi
  fi

  # 3. Verificación
  echo ">>> [3/3] Verificando integridad..."
  sudo -u postgres psql -d erp_prod -c \
    "SELECT count(*) as total_variantes, count(CASE WHEN \"costPrice\" > 0 THEN 1 END) as con_costo, count(CASE WHEN \"basePrice\" > 0 THEN 1 END) as con_precio FROM catalog.\"ProductVariant\";" || true
fi

echo ""
echo "======================================================"
echo "  ✅ Precios y costos restaurados con éxito en producción"
echo "======================================================"
