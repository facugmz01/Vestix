# AGENTS.md

## Project memory / fast context

Start with [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md). Read only the relevant section of [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md); use [docs/PROJECT_OPERATIONS.md](docs/PROJECT_OPERATIONS.md) for commands and validation caveats. These documents were checked against code on 2026-11-03; current source takes precedence. Keep them updated when changing architecture, important flows or commands. Never copy secrets into memory. Avoid loading all historical design documents for routine tasks.

## Cursor Cloud specific instructions

This repo is a single product, **Vestix ERP + POS** (clothing retail, Argentina). It has two apps:

- `backend/` — NestJS 11 REST API (Prisma + PostgreSQL, Redis/BullMQ). Global route prefix `/api` (health is at `/health`).
- `frontend/` — Vite + React 18 SPA (admin backoffice, POS, and public storefront).

Standard scripts live in `backend/package.json` and `frontend/package.json`. The update script already installs deps, generates the Prisma client, and creates/seeds the dev DB.

### Services & how to run them (dev)

- **PostgreSQL 16** and **Redis 7** must be running. On this VM they are started with `sudo pg_ctlcluster 16 main start` and `sudo service redis-server start` (systemd is not available, so use `service`/`pg_ctlcluster`, not `systemctl`). The dev DB is `erp_prod`, user `postgres`, password `root`, matching `backend/.env`'s `DATABASE_URL`.
- **Backend:** `cd backend && PORT=3001 npm run start:dev`. It MUST run on **port 3001** because `frontend/vite.config.ts` proxies `/api` to `http://localhost:3001` (do not run it on the `.env` default 3000, which collides with the frontend).
- **Frontend:** `cd frontend && npm run dev` (serves on port 3000, proxies `/api` to the backend).

### Production / any-host deploy (Docker)

Preferred install path: `docs/docker-deployment.md`.

```bash
./scripts/docker-install.sh   # first time
./scripts/docker-update.sh    # backup → rebuild → healthcheck → auto-rollback
./scripts/docker-backup.sh
./scripts/docker-rollback.sh
```

Compose stack: Postgres 16 + Redis 7 + backend + Nginx frontend (`docker-compose.yml`).

### Non-obvious gotchas

- **Do NOT set `NODE_ENV=development` for the backend.** `backend/.env` intentionally sets `NODE_ENV=production`. In non-production mode `nestjs-pino` requires `pino-pretty`, which is not a dependency, so `start:dev` crashes with `unable to determine transport target for "pino-pretty"`. Keep `NODE_ENV=production` (watch/hot-reload from `start:dev` still works). The auth cookie is flagged `Secure`, but Chrome treats `http://localhost` as a secure context, so login still works locally.
- **Dependencies:** the reviewed checkout has no tracked `node_modules/` files (2026-11-03). If tooling fails with broken symlinks, permissions or missing Prisma WASM after moving environments, reinstall dependencies in the affected app. Do not `git add node_modules`.
- **DB schema:** use `npx prisma db push` (as `update_linux.sh` does), NOT `prisma migrate deploy`. The committed migration in `prisma/migrations/0001_init` is stale (unqualified `public` tables) and does not match the current multi-schema `schema.prisma`.
- **Seeding:** `npm run seed` creates roles, `admin@erp.com` (password `Admin123!`, bcrypt-hashed), branch, warehouse, and label templates. No products or cash registers — configure via setup wizard or admin.
- **AFIP / ARCA:** Real WSFE via `@afipsdk/afip.js`. Certs in `uploads/arca/{certAlias}.crt` + `.key` (generate CSR from Settings → ARCA). Optional `AFIP_ACCESS_TOKEN` for AfipSDK cloud. Env fallbacks: `AFIP_CERT_PATH`, `AFIP_KEY_PATH`, `AFIP_CUIT`.
- **Static checks:** backend `npm run lint` runs `tsc --noEmit -p tsconfig.json`. The frontend has no lint script; run `npx tsc --noEmit -p tsconfig.json` separately from its Vite build.
- **Tests:** `cd backend && npm test` (Jest). Run the current suite rather than assuming a historical test count. E2E setup runs `prisma db push` and seed against DATABASE_URL; use a test database and check for skipped tests.
