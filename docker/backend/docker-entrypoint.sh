#!/bin/sh
set -eu

echo "[vestix-backend] Starting entrypoint..."

# Named volumes are root-owned on first mount; fix ownership then drop privileges.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/uploads/arca /app/uploads/products /app/uploads/logos \
    /app/uploads/delivery-proofs /app/uploads/backups
  chown -R vestix:vestix /app/uploads
  exec gosu vestix /usr/local/bin/docker-entrypoint.sh "$@"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[vestix-backend] FATAL: DATABASE_URL is not set" >&2
  exit 1
fi

echo "[vestix-backend] Waiting for database..."
i=0
until node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT 1\`
  .then(() => p.\$disconnect().then(() => process.exit(0)))
  .catch(() => p.\$disconnect().finally(() => process.exit(1)));
" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[vestix-backend] FATAL: database not ready after 60s" >&2
    exit 1
  fi
  sleep 1
done
echo "[vestix-backend] Database is reachable."

# Keep schema in sync. Uses db push (not migrate deploy) because committed
# migrations are stale vs multi-schema schema.prisma — see docs/prisma-migrations-strategy.md.
# Omitting --accept-data-loss so destructive changes fail closed instead of wiping data.
if [ "${SKIP_DB_SYNC:-false}" != "true" ]; then
  echo "[vestix-backend] Syncing Prisma schema (db push)..."
  npx prisma db push --skip-generate
  echo "[vestix-backend] Schema sync complete."
fi

mkdir -p uploads/arca uploads/products uploads/logos uploads/delivery-proofs uploads/backups

echo "[vestix-backend] Launching: $*"
exec "$@"
