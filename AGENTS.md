# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single product, **Vestix ERP + POS** (clothing retail, Argentina). It has two apps:

- `backend/` — NestJS 11 REST API (Prisma + PostgreSQL, Redis/BullMQ). Global route prefix `/api` (health is at `/health`).
- `frontend/` — Vite + React 18 SPA (admin backoffice, POS, and public storefront).

Standard scripts live in `backend/package.json` and `frontend/package.json`. The update script already installs deps, generates the Prisma client, and creates/seeds the dev DB.

### Services & how to run them (dev)

- **PostgreSQL 16** and **Redis 7** must be running. On this VM they are started with `sudo pg_ctlcluster 16 main start` and `sudo service redis-server start` (systemd is not available, so use `service`/`pg_ctlcluster`, not `systemctl`). The dev DB is `erp_prod`, user `postgres`, password `root`, matching `backend/.env`'s `DATABASE_URL`.
- **Backend:** `cd backend && PORT=3001 npm run start:dev`. It MUST run on **port 3001** because `frontend/vite.config.ts` proxies `/api` to `http://localhost:3001` (do not run it on the `.env` default 3000, which collides with the frontend).
- **Frontend:** `cd frontend && npm run dev` (serves on port 3000, proxies `/api` to the backend).

### Non-obvious gotchas

- **Do NOT set `NODE_ENV=development` for the backend.** `backend/.env` intentionally sets `NODE_ENV=production`. In non-production mode `nestjs-pino` requires `pino-pretty`, which is not a dependency, so `start:dev` crashes with `unable to determine transport target for "pino-pretty"`. Keep `NODE_ENV=production` (watch/hot-reload from `start:dev` still works). The auth cookie is flagged `Secure`, but Chrome treats `http://localhost` as a secure context, so login still works locally.
- **`node_modules/` is committed to git** (force-added past `.gitignore`) with broken symlinks / missing execute bits, so `npx prisma`/`vite`/etc. fail with `Permission denied` or `ENOENT ...bg.wasm`. Fix by doing a clean reinstall (`rm -rf node_modules && npm install`) in each app — the update script does this. Do not `git add node_modules`.
- **DB schema:** use `npx prisma db push` (as `update_linux.sh` does), NOT `prisma migrate deploy`. The committed migration in `prisma/migrations/0001_init` is stale (unqualified `public` tables) and does not match the current multi-schema `schema.prisma`.
- **Seeding:** `npm run seed` partially fails (it creates a `Product` referencing a nonexistent category, `P2003`), but it does create the `SUPER_ADMIN` role, the `manage/all` permission, and the `admin@erp.com` user with a bcrypt-hashed password (`Admin123!`).
- **Lint is non-functional:** `backend`'s `npm run lint` runs `eslint --fix` but ESLint is not a dependency and there is no `eslint.config.*`, so it errors out. The frontend has no lint script. Use `tsc`/build for static checks instead.
- **Tests:** `cd backend && npm test` (jest). ~19 tests fail on `main` due to pre-existing incomplete Prisma mocks (see committed `test-backend.log`); these are not environment issues.
