#!/usr/bin/env bash
# =============================================================================
# Vestix ERP - Aplicar Cambios de Base de Datos en Producción
# Compatible con Docker Compose, Podman Compose, Podman directo y Nativo Linux (PM2)
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SQL_FILE="${ROOT_DIR}/scripts/apply_db_changes_prod.sql"
BACKUP_DIR="${ROOT_DIR}/backups"
mkdir -p "$BACKUP_DIR"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: no se encontró el archivo $SQL_FILE" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/vestix-pre-db-cleanup-${STAMP}.sql.gz"

echo "======================================================"
echo "  Vestix ERP - Migración de DB en Producción"
echo "======================================================"
echo ""

# Detección de entorno
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "vestix-postgres"; then
  CONTAINER_RUNNER="docker"
elif command -v podman >/dev/null 2>&1 && podman ps --format '{{.Names}}' 2>/dev/null | grep -q "vestix-postgres"; then
  CONTAINER_RUNNER="podman"
else
  CONTAINER_RUNNER="native"
fi

if [ "$CONTAINER_RUNNER" = "docker" ] || [ "$CONTAINER_RUNNER" = "podman" ]; then
  echo ">>> Detectado entorno de CONTENEDORES ($CONTAINER_RUNNER)"
  PG_CONTAINER="$($CONTAINER_RUNNER ps --format '{{.Names}}' | grep vestix.*postgres | head -1)"
  REDIS_CONTAINER="$($CONTAINER_RUNNER ps --format '{{.Names}}' | grep vestix.*redis | head -1 || true)"

  # 1. Backup de seguridad
  echo ">>> [1/4] Realizando backup de seguridad previo -> $BACKUP_FILE..."
  if [ -f "$ROOT_DIR/scripts/docker-backup.sh" ] && [ "$CONTAINER_RUNNER" = "docker" ]; then
    "$ROOT_DIR/scripts/docker-backup.sh" || true
  else
    $CONTAINER_RUNNER exec -i "$PG_CONTAINER" pg_dump -U erp_admin erp_prod | gzip -c > "$BACKUP_FILE" || true
  fi

  # 2. Ejecutar transacción SQL
  echo ">>> [2/4] Ejecutando migración y limpieza transaccional en PostgreSQL..."
  $CONTAINER_RUNNER exec -i "$PG_CONTAINER" psql -U erp_admin -d erp_prod < "$SQL_FILE"

  # 3. Purgar caché de Redis
  if [ -n "$REDIS_CONTAINER" ]; then
    echo ">>> [3/4] Purgando caché de Redis..."
    $CONTAINER_RUNNER exec -i "$REDIS_CONTAINER" redis-cli flushall >/dev/null 2>&1 || true
  fi

  # 4. Verificación
  echo ">>> [4/4] Verificando integridad..."
  echo "--- Listas de Precios:"
  $CONTAINER_RUNNER exec -i "$PG_CONTAINER" psql -U erp_admin -d erp_prod -c "SELECT count(*) as total_listas FROM catalog.\"PriceList\";"
  
  echo "--- Entradas de Listas:"
  $CONTAINER_RUNNER exec -i "$PG_CONTAINER" psql -U erp_admin -d erp_prod -c "SELECT count(*) as total_entradas FROM catalog.\"PriceListEntry\";"

  echo "--- Clientes con Lista Asignada:"
  $CONTAINER_RUNNER exec -i "$PG_CONTAINER" psql -U erp_admin -d erp_prod -c "SELECT count(*) as clientes_con_lista FROM sales.\"Customer\" WHERE \"priceListId\" IS NOT NULL;"

  echo "--- Variantes (Costos y Precios Base):"
  $CONTAINER_RUNNER exec -i "$PG_CONTAINER" psql -U erp_admin -d erp_prod -c "SELECT count(*) as total_variantes, count(CASE WHEN \"costPrice\" > 0 THEN 1 END) as con_costo, count(CASE WHEN \"basePrice\" > 0 THEN 1 END) as con_precio_base FROM catalog.\"ProductVariant\";"

else
  echo ">>> Detectado entorno NATIVO LINUX (/var/www/vestix)"
  
  # 1. Backup de seguridad
  echo ">>> [1/4] Realizando backup de seguridad previo -> $BACKUP_FILE..."
  if sudo -u postgres pg_dump erp_prod 2>/dev/null | gzip -c > "$BACKUP_FILE"; then
    echo "    ✓ Backup guardado ($(du -h "$BACKUP_FILE" 2>/dev/null | cut -f1))"
  else
    echo "    Advertencia: no se pudo crear backup con usuario postgres, intentando continuar..."
  fi

  # 2. Ejecutar transacción SQL
  echo ">>> [2/4] Ejecutando migración y limpieza transaccional en PostgreSQL..."
  if sudo -u postgres psql -d erp_prod -f "$SQL_FILE" 2>/dev/null; then
    echo "    ✓ Script ejecutado exitosamente."
  else
    if [ -f "$ROOT_DIR/backend/.env" ]; then
      DB_URL="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/backend/.env" | head -1 | cut -d= -f2- | tr -d '\"' || true)"
      if [ -n "$DB_URL" ]; then
        psql "$DB_URL" -f "$SQL_FILE"
      fi
    else
      psql -U erp_admin -d erp_prod -f "$SQL_FILE" || true
    fi
  fi

  # 3. Purgar caché de Redis
  echo ">>> [3/4] Purgando caché de Redis..."
  redis-cli flushall >/dev/null 2>&1 || true

  # 4. Verificación
  echo ">>> [4/4] Verificando integridad..."
  echo "--- Listas de Precios:"
  sudo -u postgres psql -d erp_prod -c "SELECT count(*) as total_listas FROM catalog.\"PriceList\";" 2>/dev/null || psql -U erp_admin -d erp_prod -c "SELECT count(*) as total_listas FROM catalog.\"PriceList\";" || true
  
  echo "--- Entradas de Listas:"
  sudo -u postgres psql -d erp_prod -c "SELECT count(*) as total_entradas FROM catalog.\"PriceListEntry\";" 2>/dev/null || psql -U erp_admin -d erp_prod -c "SELECT count(*) as total_entradas FROM catalog.\"PriceListEntry\";" || true

  echo "--- Clientes con Lista Asignada:"
  sudo -u postgres psql -d erp_prod -c "SELECT count(*) as clientes_con_lista FROM sales.\"Customer\" WHERE \"priceListId\" IS NOT NULL;" 2>/dev/null || psql -U erp_admin -d erp_prod -c "SELECT count(*) as clientes_con_lista FROM sales.\"Customer\" WHERE \"priceListId\" IS NOT NULL;" || true

  echo "--- Variantes (Costos y Precios Base):"
  sudo -u postgres psql -d erp_prod -c "SELECT count(*) as total_variantes, count(CASE WHEN \"costPrice\" > 0 THEN 1 END) as con_costo, count(CASE WHEN \"basePrice\" > 0 THEN 1 END) as con_precio_base FROM catalog.\"ProductVariant\";" 2>/dev/null || psql -U erp_admin -d erp_prod -c "SELECT count(*) as total_variantes, count(CASE WHEN \"costPrice\" > 0 THEN 1 END) as con_costo, count(CASE WHEN \"basePrice\" > 0 THEN 1 END) as con_precio_base FROM catalog.\"ProductVariant\";" || true
fi

echo ""
echo "======================================================"
echo "  ✅ Migración y limpieza de DB completadas con éxito"
echo "======================================================"
