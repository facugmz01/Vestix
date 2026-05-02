# Full Technical Audit Report: Production Readiness

## 1. Executive Summary
This audit evaluates the retail ERP system against strict production-readiness criteria. While the architectural documentation (V2) and database schemas (Prisma) have been successfully modernized to support offline resilience and strict invariants, **the active codebase has not yet fully adopted these patterns**. The system is currently **NOT READY** for production. Moving to production now would result in God Class failures, XSS vulnerabilities via `localStorage`, UI freezing during offline catalog syncs, and synchronous blocking on external AFIP APIs. 

## 2. Critical Blockers
1. **SalesService God Class**: The `SalesService` is still tightly coupled to Finance and Inventory logic. The `CheckoutOrchestrator` has not been implemented in code.
2. **Missing Transaction Boundaries**: Without the Orchestrator, cross-module updates (stock decrement + treasury receipt) are not running inside a Prisma `$transaction`, risking partial data commits (e.g., customer charged, but stock not updated).
3. **XSS JWT Vulnerability**: The frontend `api/client.ts` stores JWTs in `localStorage`. Any malicious 3rd-party script can steal the session.
4. **Offline Storage Limits**: The frontend `offlineQueue.store.ts` uses `localStorage`. It has a strict ~5MB limit and is synchronously blocking. A large catalog sync or a long offline weekend will crash the POS tab and cause data loss.

## 3. High Priority Issues
1. **Synchronous AFIP Calls**: `InvoicingService` calls government APIs synchronously during the HTTP request. If AFIP is down or slow, the checkout request hangs and timeouts, frustrating cashiers.
2. **Price Variance Implementation Missing**: The DB schema has `SaleOrderVariance`, but the backend logic to compare POS totals vs Server totals and insert this variance has not been written.
3. **Missing Audit Middleware**: `AuditService` exists but is not automatically catching all mutations. It must be integrated (preferably via a Prisma extension/middleware) to guarantee 100% coverage.

## 4. Medium Issues
1. **No Rate Limiting**: The API is vulnerable to brute-force or DDoS attacks.
2. **No Structured Logging**: Default NestJS console logs are used, making production debugging and metric scraping (e.g., Datadog/ELK) impossible.
3. **E-commerce Reservation TTL**: No cron job exists to clear expired stock reservations if a MercadoPago webhook fails to arrive.

## 5. Backend Issues
- `CheckoutOrchestrator` does not exist in code.
- AFIP integration lacks a BullMQ background queue.
- `PermissionsGuard` is secure, but unhandled exceptions could leak stack traces if standard exception filters are not unified.

## 6. Frontend Issues
- `localStorage` usage for both Auth (`erp_token`) and Offline State.
- Missing `IndexedDB` integration for catalog caching.
- No global retry backoff mechanism for the offline sync engine.

## 7. DB Issues
- The Prisma schema is production-ready, but migrations have not been run against a live database.
- Missing explicit indexes on frequently filtered fields like `SaleOrder.createdAt` and `SaleOrder.status`.

## 8. Backend/Frontend Mismatches
- Frontend POS cart calculation relies on `POST /pos/cart/calculate`, which was stubbed but lacks full integration with the `RulesEngine`.

## 9. Production Blockers
- **Security**: JWTs in LocalStorage.
- **Reliability**: No DB Transactions implemented for Checkout.
- **Resilience**: AFIP synchronous blocking.

## 10. Exact Correction Order
1. **Security Fix**: Move JWT to HttpOnly cookies.
2. **Architecture Refactor**: Create `CheckoutOrchestrator` using Prisma `$transaction`.
3. **Resilience Fix**: Implement `PriceVariance` tracking inside the Orchestrator.
4. **Offline Fix**: Migrate frontend offline queue from `localStorage` to `IndexedDB` (`idb-keyval`).
5. **Performance Fix**: Move AFIP to BullMQ.
6. **Hardening**: Add ThrottlerModule, Pino Logger, and global exception filters.
