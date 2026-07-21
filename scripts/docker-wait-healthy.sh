#!/usr/bin/env bash
# Wait until backend (+ web proxy /health) are healthy.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TIMEOUT_SEC="${1:-180}"
COMPOSE=(docker compose -f docker-compose.yml --env-file .env)

deadline=$((SECONDS + TIMEOUT_SEC))

echo "Waiting up to ${TIMEOUT_SEC}s for services to become healthy..."

while (( SECONDS < deadline )); do
  backend_id="$("${COMPOSE[@]}" ps -q backend 2>/dev/null || true)"
  web_id="$("${COMPOSE[@]}" ps -q web 2>/dev/null || true)"

  if [ -z "$backend_id" ] || [ -z "$web_id" ]; then
    echo "  … containers not created yet"
    sleep 3
    continue
  fi

  backend_health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$backend_id" 2>/dev/null || echo missing)"
  web_health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$web_id" 2>/dev/null || echo missing)"

  echo "  backend=${backend_health}  web=${web_health}"

  if [ "$backend_health" = "healthy" ] && [ "$web_health" = "healthy" ]; then
    # Extra application-level check through the published web port
    HTTP_PORT="$(grep -E '^HTTP_PORT=' .env 2>/dev/null | head -1 | cut -d= -f2- || true)"
    HTTP_PORT="${HTTP_PORT:-80}"
    if curl -fsS "http://127.0.0.1:${HTTP_PORT}/health" >/dev/null 2>&1 \
      || curl -fsS "http://127.0.0.1:${HTTP_PORT}/api/setup/status" >/dev/null 2>&1; then
      echo "Services are healthy."
      exit 0
    fi
    echo "  … containers healthy but HTTP probe still failing"
  fi

  if [ "$backend_health" = "unhealthy" ] || [ "$web_health" = "unhealthy" ]; then
    echo "A service reported unhealthy. Recent backend logs:" >&2
    "${COMPOSE[@]}" logs --tail=80 backend >&2 || true
    exit 1
  fi

  sleep 4
done

echo "Timed out waiting for healthy services." >&2
"${COMPOSE[@]}" ps >&2 || true
"${COMPOSE[@]}" logs --tail=80 backend >&2 || true
exit 1
