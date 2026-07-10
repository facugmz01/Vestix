# Full Technical Audit Report: Production Readiness

*Last updated: July 2026*

## 1. Executive Summary
The Vestix ERP codebase has progressed significantly since the initial audit. **CheckoutOrchestrator**, HttpOnly cookie auth, IndexedDB offline queues, structured Pino logging, global exception filters, and ThrottlerModule are now in place. The system is **closer to production** but still has gaps in AFIP resilience, full audit coverage validation, and some incomplete admin UI flows (e.g. ARCA certificate management).

## 2. Resolved Since Initial Audit
1. **CheckoutOrchestrator**: Implemented in `backend/src/domains/sales/checkout.orchestrator.ts` and wired into POS, storefront, and integrations.
2. **Transaction Boundaries**: Checkout flows use Prisma `$transaction` via the orchestrator.
3. **JWT Security**: Auth uses HttpOnly `erp_token` cookies; frontend `api/client.ts` uses `withCredentials` and does not read tokens from `localStorage`.
4. **Offline Storage**: POS offline queue and catalog sync use IndexedDB (Dexie) via `useDexieSync` and `offlineQueue.store.ts`.
5. **Structured Logging**: `nestjs-pino` configured in `AppModule` and `main.ts`.
6. **Rate Limiting**: `ThrottlerModule` with global `ThrottlerGuard`; stricter limits on `/auth/login` and `/setup/*` POST routes.
7. **Audit Interceptor**: Registered globally in `AppModule`; `userId` sourced from `request.user.userId` (JwtStrategy payload).

## 3. Remaining Critical / High Priority
1. **Synchronous AFIP Calls**: `InvoicingService` can still block checkout when AFIP is slow. BullMQ background queue is the recommended fix.
2. **ARCA Certificate UI**: Frontend ARCA panel honestly shows disabled state; backend CSR/cert upload endpoints are not yet implemented.
3. **Price Variance**: `SaleOrderVariance` schema exists; full POS-vs-server variance tracking should be verified end-to-end in the orchestrator.

## 4. Medium Issues
1. **E-commerce Reservation TTL**: Cron to clear expired stock reservations if MercadoPago webhooks fail.
2. **Legacy `core/api/apiClient.ts`**: Removed; all API calls go through `frontend/src/api/client.ts`.
3. **Test Coverage**: ~19 backend unit tests fail on incomplete Prisma mocks (pre-existing).

## 5. Backend Status
- `CheckoutOrchestrator` — **done**
- Global `AuditInterceptor` + `ThrottlerGuard` — **done**
- `PermissionsGuard` + unified `GlobalHttpExceptionFilter` — **done**
- AFIP BullMQ queue — **pending**

## 6. Frontend Status
- HttpOnly cookie session via `/auth/me` — **done**
- IndexedDB offline sync — **done**
- POS receipt header/footer from branch settings — **done**
- Price list customer assignment modal — **done**
- ARCA CSR/cert upload — **blocked on backend**

## 7. DB Status
- Multi-schema Prisma model is current; use `npx prisma db push` for dev (not stale `migrate deploy`).
- Review indexes on `SaleOrder.createdAt` and `SaleOrder.status` for production load.

## 8. Recommended Next Steps
1. Move AFIP invoicing to BullMQ with async status polling.
2. Implement ARCA CSR generation and certificate upload endpoints.
3. Fix failing Jest mocks and add integration tests for checkout + audit trails.
4. Add reservation TTL cron for storefront stock holds.
