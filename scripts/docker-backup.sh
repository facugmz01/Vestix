#!/usr/bin/env bash
# Create a Postgres logical backup into ./backups/
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f docker-compose.yml --env-file .env)
BACKUP_DIR="${ROOT_DIR}/backups"
mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${BACKUP_DIR}/vestix-${STAMP}.sql.gz"

if [ ! -f .env ]; then
  echo "ERROR: missing .env — run ./scripts/docker-install.sh first." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source .env
set +a

echo ">>> Creating database backup → ${OUT_FILE}"
"${COMPOSE[@]}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-erp_admin}" -d "${POSTGRES_DB:-erp_prod}" --no-owner --no-acl \
  | gzip -c > "$OUT_FILE"

# Keep a stable pointer to the latest backup for rollback scripts
ln -sfn "$(basename "$OUT_FILE")" "${BACKUP_DIR}/latest.sql.gz"

# Retain last 20 backups
ls -1t "$BACKUP_DIR"/vestix-*.sql.gz 2>/dev/null | tail -n +21 | xargs -r rm -f

echo ">>> Backup OK ($(du -h "$OUT_FILE" | awk '{print $1}'))"
echo "$OUT_FILE"
