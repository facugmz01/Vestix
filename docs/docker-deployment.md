# Despliegue con Docker — Vestix ERP + POS

Esta es la forma recomendada de instalar Vestix en cualquier servidor (VPS, bare metal, lab local). El stack completo corre en contenedores:

| Servicio | Imagen | Rol |
|----------|--------|-----|
| `postgres` | `postgres:16-alpine` | Base de datos (volúmenes persistentes) |
| `redis` | `redis:7-alpine` | Colas BullMQ + rate limiting |
| `backend` | `vestix-backend:<versión>` | NestJS API (`/api`, `/health`, `/uploads`) |
| `web` | `vestix-web:<versión>` | SPA + Nginx (proxy a la API) |

## Requisitos

- Docker Engine 24+ con plugin **Compose v2** (`docker compose`)
- Puertos libres: `80` (o el que configures en `HTTP_PORT`)
- ~2 GB RAM mínimo recomendado

## Instalación (primera vez)

```bash
git clone https://github.com/facugmz01/Vestix.git
cd Vestix
chmod +x scripts/docker-*.sh
./scripts/docker-install.sh
```

El instalador:

1. Crea `.env` desde `.env.docker.example` (si no existe)
2. Genera `JWT_SECRET`, `SETTINGS_ENCRYPTION_KEY` y `POSTGRES_PASSWORD`
3. Pregunta la `APP_URL` pública
4. Construye imágenes y levanta el stack
5. Espera healthchecks (`/health`)
6. Etiqueta las imágenes como `:current` / `:previous` (para rollback)

Abrí la URL en el navegador y completá el **setup wizard** (super admin + empresa).

### Instalación no interactiva

```bash
cp .env.docker.example .env
# editar secretos + APP_URL + COOKIE_SECURE
./scripts/docker-install.sh   # reutiliza el .env existente
```

## Actualización confiable

```bash
./scripts/docker-update.sh
```

Flujo (en orden):

1. **Backup** lógico de PostgreSQL → `backups/vestix-<timestamp>.sql.gz`
2. Marca las imágenes actuales como `:previous`
3. `git fetch` + `reset --hard origin/main` (preserva `.env`)
4. Rebuild de `backend` + `web` con tag de versión nuevo
5. Recrea contenedores
6. Healthcheck; si falla → **rollback automático** a `:previous`

Opciones:

```bash
./scripts/docker-update.sh --no-pull      # solo rebuild del árbol local
./scripts/docker-update.sh --skip-backup  # no recomendado en prod
```

## Rollback

Solo aplicación (código anterior, misma DB):

```bash
./scripts/docker-rollback.sh
```

Aplicación + restaurar último backup de DB:

```bash
./scripts/docker-rollback.sh --restore-db
# o un archivo concreto:
./scripts/docker-rollback.sh --restore-db backups/vestix-20260324T120000Z.sql.gz
```

## Backup manual

```bash
./scripts/docker-backup.sh
```

Los backups viven en `./backups/` (gitignore). Se conservan los últimos 20.

## Variables de entorno importantes

Ver `.env.docker.example`. Las críticas:

| Variable | Notas |
|----------|-------|
| `APP_URL` | URL pública sin `/` final. Se usa para CORS y links. |
| `COOKIE_SECURE` | `true` con HTTPS; `false` solo en labs HTTP. |
| `JWT_SECRET` | Largo y aleatorio. |
| `SETTINGS_ENCRYPTION_KEY` | Exactamente 32 bytes en base64. **No la cambies** o no se podrán leer secretos ya cifrados. |
| `POSTGRES_PASSWORD` | Password de la DB interna. |
| `VESTIX_VERSION` | Tag de imagen; lo mantienen los scripts. |
| `SKIP_DB_SYNC` | `true` solo para arranques de emergencia sin `prisma db push`. |

## HTTPS

El compose publica HTTP. En producción poné TLS delante:

- Cloudflare / reverse proxy / Caddy / Nginx en el host, o
- Terminar SSL en un load balancer

Con HTTPS, dejá `COOKIE_SECURE=true` (el instalador lo setea solo si `APP_URL` empieza con `https://`).

## Schema / migraciones

Al arrancar, el backend ejecuta `prisma db push` (no `migrate deploy`). Esto coincide con `deploy_linux.sh` / `update_linux.sh` y evita la migración stale `0001_init`. Detalle: `docs/prisma-migrations-strategy.md`.

Cambios de schema **destructivos** fallan cerrados (sin `--accept-data-loss`). En ese caso: backup, revisar el diff, y resolver manualmente.

## Comandos útiles

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f web
docker compose restart backend
curl -fsS http://127.0.0.1/health
```

## Persistencia

Volúmenes Docker:

- `vestix_pg_data` — PostgreSQL
- `vestix_redis_data` — Redis AOF
- `vestix_uploads` — logos, productos, certs ARCA, backups internos

Borrar volúmenes = pérdida de datos. No uses `docker compose down -v` en producción.
