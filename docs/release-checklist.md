# CI/CD Release Validation

Before merging any code to the `production` branch, the CI pipeline MUST pass the following steps:

## 1. Static Analysis & Build
- [ ] `npm run lint` (Frontend & Backend)
- [ ] `npx prisma validate` (Checks schema syntax)
- [ ] `npm run build` (Backend compilation passes)
- [ ] `npm run build` (Frontend Vite build passes)

## 2. Security Checks
- [ ] Dependency Audit: `npm audit --production` shows 0 high/critical vulnerabilities.
- [ ] Secrets Scan: Ensure no `.env` or hardcoded JWT secrets are committed.

## 3. Database Safety
- [ ] Migration check: Run `npx prisma migrate status` to ensure all migrations are committed.
- [ ] Verify `@@index` coverage on any newly created tables containing > 10,000 rows.

## 4. Frontend Offline Sync Contract
- [ ] Ensure any modified frontend API payloads still align with what the backend expects, as offline clients may send payloads based on older code structures. Backward compatibility is required for at least 7 days to drain offline queues.
