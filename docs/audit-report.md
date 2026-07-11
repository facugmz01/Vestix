# Full Technical Audit Report: Production Readiness

*Last updated: July 2026*

## 1. Executive Summary

Vestix ERP has reached **production-viable** status for core retail operations (POS, catalog, checkout, finance, offline sync). Remaining gaps are mostly **third-party certification** (AFIP homologación with real certificates), **Shopify variant mapping setup**, and **operational hardening** (integration tests, Prisma migrate strategy for prod deploys).

## 2. Resolved

| Area | Status |
|------|--------|
| CheckoutOrchestrator + `$transaction` | Done |
| HttpOnly cookie auth | Done |
| Unified offline queue (IndexedDB) | Done |
| AFIP WSFE via `@afipsdk/afip.js` | Done (requires real certs) |
| Factura A/B resolution by CUIT/DNI | Done |
| ARCA CSR + cert upload endpoints | Done |
| Finance invoices/payments API | Done |
| Stock reservations CRUD | Done |
| Current account movements persisted | Done |
| Audit log read API + entity trace | Done |
| Warehouse locations CRUD | Done |
| Shopify/ML/WC order import | Done |
| Shopify inventory sync (mapped variants) | Done |
| Couriers fail-closed (no fake tracking) | Done |
| Global audit interceptor + throttler | Done |
| 250+ unit tests passing | Done |

## 3. Remaining Before Go-Live

1. **AFIP homologación** — Generate CSR, upload cert to AFIP, test in homologation environment with real CUIT. See `docs/afip-homologation-checklist.md`.
2. **ShopifyVariantMapping** — Admin must map ERP variants to Shopify variant IDs before inventory sync works.
3. **Integration / e2e tests** — Framework added (`npm run test:e2e`); run with PostgreSQL for full coverage.
4. **Prisma migrations** — See `docs/prisma-migrations-strategy.md` for production baseline approach.

## 4. Medium / Low

- Factura C, multi-IVA, debit notes, and Libro IVA implemented (Jul 2026).
- Outbox handles STOCK_MOVEMENT + ORDER events; extend as new integrations are added.
- Legacy `modules/*` code removed from active imports; orphaned inventory stubs may remain.

## 5. Recommended Next Steps

1. Run AFIP homologación with real certificates.
2. Map Shopify variants in admin integrations UI.
3. Add e2e tests for checkout + webhook ingestion.
4. Document production deploy checklist (`docs/production-deployment.md`).
