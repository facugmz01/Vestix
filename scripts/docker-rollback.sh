#!/usr/bin/env bash
# Roll back Vestix Docker app images (and optionally restore latest DB backup).
#
# Usage:
#   ./scripts/docker-rollback.sh
#   ./scripts/docker-rollback.sh --restore-db
#   ./scripts/docker-rollback.sh --restore-db /path/to/backup.sql.gz
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f docker-compose.yml --env-file .env)
RESTORE_DB=false
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restore-db)
      RESTORE_DB=true
      if [[ "${2:-}" != "" && "${2:-}" != --* ]]; then
        BACKUP_FILE="$2"
        shift
      fi
      ;;
    -h|--help)
      sed -n '2,10p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
  shift
done

if [ ! -f .env ]; then
  echo "ERROR: missing .env" >&2
  exit 1
fi

if ! docker image inspect vestix-backend:previous >/dev/null 2>&1 \
  || ! docker image inspect vestix-web:previous >/dev/null 2>&1; then
  echo "ERROR: no vestix-*:previous images found. Cannot rollback." >&2
  exit 1
fi

PREVIOUS_VERSION="$(grep -E '^VESTIX_VERSION=' .env | head -1 | cut -d= -f2- || true)"
PREVIOUS_VERSION="${PREVIOUS_VERSION:-previous}"

echo ">>> Rolling back application containers to :previous ..."
docker tag vestix-backend:previous "vestix-backend:${PREVIOUS_VERSION}"
docker tag vestix-web:previous "vestix-web:${PREVIOUS_VERSION}"
docker tag vestix-backend:previous vestix-backend:current
docker tag vestix-web:previous vestix-web:current

"${COMPOSE[@]}" up -d --no-build --force-recreate backend web

if [ "$RESTORE_DB" = true ]; then
  if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE="${ROOT_DIR}/backups/latest.sql.gz"
  fi
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: backup file not found: $BACKUP_FILE" >&2
    exit 1
  fi

  # shellcheck disable=SC1091
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a

  echo ">>> Restoring database from $BACKUP_FILE ..."
  echo "    WARNING: this overwrites the current database."

  # Plain dumps (especially without --clean) fail with
  # `schema "catalog" already exists` unless app schemas are dropped first.
  "${COMPOSE[@]}" exec -T postgres \
    psql -U "${POSTGRES_USER:-erp_admin}" -d "${POSTGRES_DB:-erp_prod}" \
    -v ON_ERROR_STOP=1 \
    -c "DROP SCHEMA IF EXISTS core CASCADE;
DROP SCHEMA IF EXISTS catalog CASCADE;
DROP SCHEMA IF EXISTS inventory CASCADE;
DROP SCHEMA IF EXISTS sales CASCADE;
DROP SCHEMA IF EXISTS purchasing CASCADE;
DROP SCHEMA IF EXISTS finance CASCADE;
DROP SCHEMA IF EXISTS settings CASCADE;" >/dev/null

  gunzip -c "$BACKUP_FILE" | "${COMPOSE[@]}" exec -T postgres \
    psql -U "${POSTGRES_USER:-erp_admin}" -d "${POSTGRES_DB:-erp_prod}" \
    -v ON_ERROR_STOP=1 >/dev/null

  "${COMPOSE[@]}" restart backend
fi

"$ROOT_DIR/scripts/docker-wait-healthy.sh" 120

echo ""
echo "✅ Rollback completed."
