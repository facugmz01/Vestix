#!/usr/bin/env bash
# Vestix ERP — first-time Docker install
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f docker-compose.yml)

echo "======================================================"
echo "  Vestix ERP — Instalación Docker"
echo "======================================================"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker no está instalado. Instalalo e intentá de nuevo." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Docker Compose v2 no está disponible (plugin 'docker compose')." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo ">>> Creando .env desde .env.docker.example..."
  cp .env.docker.example .env

  JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  SETTINGS_ENCRYPTION_KEY="$(docker run --rm node:20-bookworm-slim node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  POSTGRES_PASSWORD="$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 24)"

  # Portable env updates without requiring GNU sed -i
  tmp_env="$(mktemp)"
  awk -v jwt="$JWT_SECRET" \
      -v enc="$SETTINGS_ENCRYPTION_KEY" \
      -v dbpass="$POSTGRES_PASSWORD" '
    /^JWT_SECRET=/ { print "JWT_SECRET=" jwt; next }
    /^SETTINGS_ENCRYPTION_KEY=/ { print "SETTINGS_ENCRYPTION_KEY=" enc; next }
    /^POSTGRES_PASSWORD=/ { print "POSTGRES_PASSWORD=" dbpass; next }
    { print }
  ' .env > "$tmp_env"
  mv "$tmp_env" .env

  echo ""
  echo "Ingresá la URL pública (sin barra final)."
  echo "Ejemplos: https://erp.miempresa.com  |  http://192.168.1.50"
  read -r -p "  APP_URL [http://localhost]: " APP_URL_INPUT || true
  APP_URL_INPUT="${APP_URL_INPUT:-http://localhost}"

  COOKIE_SECURE_VALUE="false"
  if [[ "$APP_URL_INPUT" == https://* ]]; then
    COOKIE_SECURE_VALUE="true"
  fi

  tmp_env="$(mktemp)"
  awk -v url="$APP_URL_INPUT" -v cookie="$COOKIE_SECURE_VALUE" '
    /^APP_URL=/ { print "APP_URL=" url; next }
    /^COOKIE_SECURE=/ { print "COOKIE_SECURE=" cookie; next }
    { print }
  ' .env > "$tmp_env"
  mv "$tmp_env" .env

  echo ""
  echo "  .env generado con secretos aleatorios."
  echo "  APP_URL=$APP_URL_INPUT"
  echo "  COOKIE_SECURE=$COOKIE_SECURE_VALUE"
else
  echo ">>> Usando .env existente."
fi

# Resolve version tag
if [ -f VERSION ]; then
  VERSION_TAG="$(tr -d '[:space:]' < VERSION)"
else
  VERSION_TAG="$(git rev-parse --short HEAD 2>/dev/null || echo latest)"
fi

tmp_env="$(mktemp)"
awk -v ver="$VERSION_TAG" '
  /^VESTIX_VERSION=/ { print "VESTIX_VERSION=" ver; next }
  { print }
' .env > "$tmp_env"
mv "$tmp_env" .env

export VESTIX_VERSION="$VERSION_TAG"

echo ""
echo ">>> Construyendo e iniciando contenedores (versión: $VESTIX_VERSION)..."
"${COMPOSE[@]}" --env-file .env build
"${COMPOSE[@]}" --env-file .env up -d

echo ""
echo ">>> Esperando healthchecks..."
"$ROOT_DIR/scripts/docker-wait-healthy.sh" 180

# Tag current images as previous for future rollbacks
docker tag "vestix-backend:${VESTIX_VERSION}" vestix-backend:previous 2>/dev/null || true
docker tag "vestix-web:${VESTIX_VERSION}" vestix-web:previous 2>/dev/null || true
docker tag "vestix-backend:${VESTIX_VERSION}" vestix-backend:current
docker tag "vestix-web:${VESTIX_VERSION}" vestix-web:current

APP_URL="$(grep -E '^APP_URL=' .env | head -1 | cut -d= -f2-)"
HTTP_PORT="$(grep -E '^HTTP_PORT=' .env | head -1 | cut -d= -f2- || true)"
HTTP_PORT="${HTTP_PORT:-80}"

echo ""
echo "======================================================"
echo "  ✅ Instalación Docker completada"
echo "======================================================"
echo "  URL:           ${APP_URL}"
echo "  Puerto HTTP:   ${HTTP_PORT}"
echo "  Versión:       ${VESTIX_VERSION}"
echo ""
echo "  Próximo paso: abrí la URL y completá el setup wizard."
echo ""
echo "  Comandos útiles:"
echo "    docker compose ps"
echo "    docker compose logs -f backend"
echo "    ./scripts/docker-update.sh"
echo "    ./scripts/docker-backup.sh"
echo "======================================================"
