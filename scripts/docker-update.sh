#!/usr/bin/env bash
# Vestix ERP — reliable Docker update with backup + healthcheck + rollback
#
# Usage:
#   ./scripts/docker-update.sh              # pull git + rebuild + roll forward
#   ./scripts/docker-update.sh --no-pull    # rebuild current tree only
#   ./scripts/docker-update.sh --skip-backup
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DO_GIT_PULL=true
DO_BACKUP=true

for arg in "$@"; do
  case "$arg" in
    --no-pull) DO_GIT_PULL=false ;;
    --skip-backup) DO_BACKUP=false ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

COMPOSE=(docker compose -f docker-compose.yml --env-file .env)

echo "======================================================"
echo "  Vestix ERP — Actualización Docker"
echo "======================================================"
echo ""

if [ ! -f .env ]; then
  echo "ERROR: missing .env — run ./scripts/docker-install.sh first." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required." >&2
  exit 1
fi

# Preserve local config across git reset
ENV_BAK="$(mktemp)"
cp .env "$ENV_BAK"

PREVIOUS_VERSION="$(grep -E '^VESTIX_VERSION=' .env | head -1 | cut -d= -f2- || true)"
PREVIOUS_VERSION="${PREVIOUS_VERSION:-latest}"

rollback() {
  echo "" >&2
  echo "!!! Update failed — rolling back to previous images..." >&2

  if docker image inspect vestix-backend:previous >/dev/null 2>&1 \
    && docker image inspect vestix-web:previous >/dev/null 2>&1; then
    docker tag vestix-backend:previous "vestix-backend:${PREVIOUS_VERSION}"
    docker tag vestix-web:previous "vestix-web:${PREVIOUS_VERSION}"
    docker tag vestix-backend:previous vestix-backend:current
    docker tag vestix-web:previous vestix-web:current

    tmp_env="$(mktemp)"
    awk -v ver="$PREVIOUS_VERSION" '
      /^VESTIX_VERSION=/ { print "VESTIX_VERSION=" ver; next }
      { print }
    ' .env > "$tmp_env"
    mv "$tmp_env" .env

    "${COMPOSE[@]}" up -d --no-build backend web || true
    "$ROOT_DIR/scripts/docker-wait-healthy.sh" 120 || true
    echo "Rollback to version '${PREVIOUS_VERSION}' attempted." >&2
    echo "If health is still bad, restore DB with: ./scripts/docker-rollback.sh --restore-db" >&2
  else
    echo "No :previous images found — cannot auto-rollback containers." >&2
  fi
  exit 1
}

trap 'rc=$?; if [ $rc -ne 0 ]; then rollback; fi' ERR

# 1) Backup DB first (always, unless explicitly skipped)
if [ "$DO_BACKUP" = true ]; then
  echo ">>> [1/6] Backup de base de datos..."
  "$ROOT_DIR/scripts/docker-backup.sh"
else
  echo ">>> [1/6] Backup omitido (--skip-backup)."
fi

# 2) Snapshot current images as :previous
echo ">>> [2/6] Marcando imágenes actuales como :previous..."
if docker image inspect "vestix-backend:${PREVIOUS_VERSION}" >/dev/null 2>&1; then
  docker tag "vestix-backend:${PREVIOUS_VERSION}" vestix-backend:previous
fi
if docker image inspect "vestix-web:${PREVIOUS_VERSION}" >/dev/null 2>&1; then
  docker tag "vestix-web:${PREVIOUS_VERSION}" vestix-web:previous
fi

# 3) Pull latest code (optional)
if [ "$DO_GIT_PULL" = true ]; then
  echo ">>> [3/6] Descargando cambios (git)..."
  if [ -d .git ]; then
    git fetch origin
    # Prefer main, fall back to current upstream
    if git rev-parse --verify origin/main >/dev/null 2>&1; then
      git reset --hard origin/main
    else
      git pull --ff-only || true
    fi
  else
    echo "    (no es un repo git — se reconstruye el árbol local)"
  fi
else
  echo ">>> [3/6] Git pull omitido (--no-pull)."
fi

# Restore .env after hard reset
cp "$ENV_BAK" .env
rm -f "$ENV_BAK"

# 4) Compute new version tag
if [ -f VERSION ]; then
  NEW_VERSION="$(tr -d '[:space:]' < VERSION)"
else
  NEW_VERSION="$(git rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)"
fi

# If VERSION unchanged, append git short sha for uniqueness
if [ "$NEW_VERSION" = "$PREVIOUS_VERSION" ] && [ -d .git ]; then
  NEW_VERSION="${NEW_VERSION}+$(git rev-parse --short HEAD)"
fi

tmp_env="$(mktemp)"
awk -v ver="$NEW_VERSION" '
  /^VESTIX_VERSION=/ { print "VESTIX_VERSION=" ver; next }
  { print }
' .env > "$tmp_env"
mv "$tmp_env" .env
export VESTIX_VERSION="$NEW_VERSION"

echo ">>> [4/6] Construyendo imágenes (${PREVIOUS_VERSION} → ${NEW_VERSION})..."
"${COMPOSE[@]}" build backend web

echo ">>> [5/6] Recreando servicios de aplicación..."
"${COMPOSE[@]}" up -d --no-deps --force-recreate backend
# Wait briefly so web depends_on health can pass when we recreate web after
"$ROOT_DIR/scripts/docker-wait-healthy.sh" 180
"${COMPOSE[@]}" up -d --no-deps --force-recreate web

echo ">>> [6/6] Verificación final de salud..."
"$ROOT_DIR/scripts/docker-wait-healthy.sh" 90

# Promote tags
docker tag "vestix-backend:${NEW_VERSION}" vestix-backend:current
docker tag "vestix-web:${NEW_VERSION}" vestix-web:current

# Disable ERR trap after success
trap - ERR

echo ""
echo "======================================================"
echo "  ✅ Actualización completada"
echo "======================================================"
echo "  Versión anterior: ${PREVIOUS_VERSION}"
echo "  Versión actual:   ${NEW_VERSION}"
echo "  Rollback rápido:  ./scripts/docker-rollback.sh"
echo "======================================================"
