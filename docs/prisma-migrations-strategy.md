# Prisma Migrations Strategy (Production)

This document defines how Vestix ERP manages PostgreSQL schema changes in **development** vs **production**. It replaces the stale committed migration `prisma/migrations/0001_init`, which targets unqualified `public` tables and does **not** match the current multi-schema `schema.prisma` (`core`, `catalog`, `inventory`, `sales`, `purchasing`, `finance`, `settings`).

## Current state

| Artifact | Status |
|----------|--------|
| `schema.prisma` | Source of truth (multi-schema PostgreSQL 16+) |
| `prisma db push` | Used in dev and deploy scripts (`update_linux.sh`, `deploy_linux.sh`) |
| `prisma/migrations/0001_init` | **Stale — do not run** |
| `prisma/migrations/0002_catalog_pending_features` | Partial incremental SQL; not a full baseline |

**Do not run `prisma migrate deploy` against a fresh database today.** It will apply `0001_init` and produce an incompatible schema.

## Development (local / CI without migration history)

Use schema sync, not migration deploy:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed   # optional: roles, admin@erp.com, branch, warehouse
```

`db push` is appropriate when:

- The database is disposable (local dev, ephemeral CI).
- You are iterating on `schema.prisma` and need fast feedback.
- No production migration history exists yet.

## Production strategy: baseline + incremental migrations

Production needs **versioned, auditable, rollback-friendly** changes. The recommended path is a **one-time baseline** from the live schema, then `migrate deploy` for every subsequent release.

### Phase A — Establish the baseline (one time)

Perform this when preparing the first production-ready migration track, or when resetting migration history after the stale `0001_init` era.

1. **Ensure production DB matches `schema.prisma`**

   On a staging DB that mirrors production (or production itself during a maintenance window):

   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

   Verify the app starts and critical flows work (login, checkout, inventory).

2. **Archive stale migrations**

   ```bash
   mkdir -p prisma/migrations/_archive
   mv prisma/migrations/0001_init prisma/migrations/_archive/
   mv prisma/migrations/0002_* prisma/migrations/_archive/ 2>/dev/null || true
   ```

   Keep the archive in git for historical reference only.

3. **Create a baseline migration from the database**

   Prisma 5 supports baselining an existing database:

   ```bash
   # Generate SQL that represents the current schema (empty DB → current state)
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/0_baseline/migration.sql

   # Mark baseline as already applied (DB already has these objects)
   npx prisma migrate resolve --applied 0_baseline
   ```

   Alternatively, if the DB was built with `db push` and `_prisma_migrations` is empty:

   ```bash
   npx prisma migrate dev --name baseline --create-only
   # Review generated SQL, then:
   npx prisma migrate resolve --applied <baseline_folder_name>
   ```

4. **Commit** the new `prisma/migrations/<baseline>/migration.sql` and remove reliance on `db push` in production deploy scripts.

### Phase B — Ongoing schema changes

For each schema change after the baseline:

1. Edit `prisma/schema.prisma`.
2. Create a migration (review SQL before applying):

   ```bash
   npx prisma migrate dev --name describe_change
   ```

3. Test on staging:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   ```

4. Deploy to production (during release):

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   pm2 restart vestix-backend
   ```

### Phase C — Deploy script alignment

Update production deploy scripts to use **`migrate deploy`**, not `db push`:

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart vestix-backend
```

Keep `db push` only in local dev helpers and disaster-recovery docs where a full rebuild is intentional.

## Rollback policy

Prisma does not auto-rollback migrations. For each production migration:

1. **Review** generated SQL in PR (especially `DROP`, `ALTER`, data backfills).
2. **Backup** PostgreSQL before `migrate deploy` (see `docs/rollback-plan.md`).
3. **Rollback** = restore DB snapshot + redeploy previous app version. Do not run ad-hoc `DROP` scripts unless documented.

## Multi-schema notes

- All models declare `@@schema("…")`. Baseline SQL must create schemas (`core`, `catalog`, etc.) before tables.
- When diffing, always use `--to-schema-datamodel prisma/schema.prisma` so schema qualifiers are included.
- Cross-schema foreign keys are valid in PostgreSQL; verify migration order if adding new schemas.

## CI recommendations

| Job | Command | Purpose |
|-----|---------|---------|
| Unit tests | `npm test` | No DB required (mocked Prisma) |
| E2E tests | `npm run test:e2e` | Requires PostgreSQL + Redis + seed |
| Schema drift check (post-baseline) | `npx prisma migrate diff --from-migrations … --to-schema-datamodel …` | Fail if schema.prisma diverges from migrations |

## Summary

| Environment | Tool | Notes |
|-------------|------|-------|
| Local dev | `db push` | Fast iteration; seed with `npm run seed` |
| Staging (pre-baseline) | `db push` | Until baseline migration exists |
| Staging / Production (post-baseline) | `migrate deploy` | Versioned, auditable changes |
| Never | `migrate deploy` on empty DB with stale `0001_init` | Use baseline procedure first |
