#!/usr/bin/env bash
# =============================================================================
# Vestix ERP - Aplicar Restauración de Precios y Costos en Producción
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f docker-compose.yml --env-file .env)
SQL_FILE="${ROOT_DIR}/scripts/restore_catalog_prices_prod.sql"

if [ ! -f .env ]; then
  echo "ERROR: no se encontró archivo .env en $ROOT_DIR" >&2
  exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: no se encontró el archivo $SQL_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source .env
set +a

echo "======================================================"
echo "  Vestix ERP - Restauración de Costos y Precios"
echo "======================================================"
echo ""

# 1. Backup de seguridad antes de cualquier modificación
echo ">>> [1/3] Realizando backup de seguridad previo..."
if [ -f "$ROOT_DIR/scripts/docker-backup.sh" ]; then
  "$ROOT_DIR/scripts/docker-backup.sh"
else
  echo "    (Advertencia: docker-backup.sh no encontrado, continuando...)"
fi

# 2. Ejecutar la restauración transaccional de costos y precios
echo ">>> [2/3] Ejecutando restauración transaccional en PostgreSQL..."
"${COMPOSE[@]}" exec -T postgres \
  psql -U "${POSTGRES_USER:-erp_admin}" -d "${POSTGRES_DB:-erp_prod}" < "$SQL_FILE"

# 3. Verificación
echo ">>> [3/3] Verificando integridad..."
"${COMPOSE[@]}" exec -T postgres \
  psql -U "${POSTGRES_USER:-erp_admin}" -d "${POSTGRES_DB:-erp_prod}" -c \
  "SELECT count(*) as total_variantes, count(CASE WHEN \"costPrice\" > 0 THEN 1 END) as con_costo, count(CASE WHEN \"basePrice\" > 0 THEN 1 END) as con_precio FROM catalog.\"ProductVariant\";"

echo ""
echo "======================================================"
echo "  ✅ Precios y costos restaurados con éxito en producción"
echo "======================================================"
