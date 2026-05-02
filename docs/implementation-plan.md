# Implementation Plan & Checklist

## V2 BLOCKER LIST (Must Fix Before Proceeding)
## V2 AUDIT BLOCKER LIST (Must Fix Before Proceeding)
- [ ] **Blocker 1 (Transaction Safety)**: `SalesService` acts as a God Class. Must be extracted to `CheckoutOrchestrator` with `$transaction`.
- [ ] **Blocker 2 (Security)**: JWTs are stored in `localStorage`, exposing the ERP to XSS. Must move to HttpOnly Cookies.
- [ ] **Blocker 3 (Offline Resilience)**: Offline POS Queue uses synchronous `localStorage`. Must migrate to `IndexedDB`.
- [ ] **Blocker 4 (Price Divergence)**: `SaleOrderVariance` logic must be implemented in the Orchestrator.
- [ ] **Blocker 5 (Performance)**: Synchronous AFIP API calls. Must move to BullMQ.

## V2 CORRECTION PHASES (Execution Order)
1. **[x] Phase 0.1 (Security)**: Migrate JWT Auth to HttpOnly cookies in backend and frontend.
2. **[x] Phase 0.2 (Orchestration)**: Create `CheckoutOrchestrator` and decouple `SalesService`. Wrap in Prisma `$transaction`.
3. **[x] Phase 0.3 (Data Integrity)**: Implement `PriceVariance` logic in the Orchestrator.
4. **[x] Phase 0.4 (Offline State)**: Migrate frontend Zustand offline queue to `IndexedDB`.
5. **Phase 0.5 (Queues)**: Implement BullMQ for AFIP async processing.

## PHASE 1: Data Layer (MVP Priority)
- [x] Initialize Prisma in the backend.
- [x] Write `schema.prisma` mapping all domains.
- [x] Create `PrismaService` and `PrismaModule`.
- [ ] Run initial migrations against PostgreSQL.

## PHASE 2: Security & Backend Configuration
- [x] Secure `PermissionsGuard` (fail closed by default).
- [ ] Setup unified validation pipes and exception filters.

## PHASE 3: Refactor Services to Persistence (MVP Core)
- [x] Refactor `SalesService` (Wrap checkout in `$transaction`).
- [x] Refactor `InventoryService`.
- [x] Refactor `PurchasingService`.
- [x] Refactor `InvoicingService`.
- [x] Refactor `AuditService`.
- [x] Refactor `RbacService`.

## PHASE 4: API Contracts & Frontend Alignment
- [x] Align `CreateOrderDto` (backend) with `CreateSaleDto` (frontend).
- [x] Fix frontend `sales.api.ts` endpoints.
- [x] Implement missing `/pos/cart/calculate` endpoint.

## PHASE 5: Offline Sync (POS Reliability)
- [ ] Migrate frontend `offlineQueue.store.ts` to use IndexedDB (`idb-keyval`).
- [ ] Local Catalog Cache generation for offline barcode scanning.

## PHASE 6: Integrations (Post-MVP)
- [ ] Move AFIP synchronous calls to a background queue (BullMQ).
- [ ] Implement WooCommerce and MercadoPago webhooks.
- [ ] Implement WhatsApp Evolution API notifications.

## PHASE 7: Production Hardening
- [ ] Switch JWT storage to HttpOnly cookies.
- [ ] Implement global rate limiting.
- [ ] Setup structured logging (e.g., Pino).
