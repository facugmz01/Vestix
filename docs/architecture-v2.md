# Architecture V2: Hardened Retail ERP

This document outlines the evolutionary step from V1 to V2, correcting critical theoretical blockers discovered during the architectural review.

## 1. Review & Identified Blockers

### A. Module Coupling (The God Class Problem)
In V1, `SalesService` orchestrated checkout by directly updating `Customer` credit, creating `TreasuryReceipts`, and creating `InventoryMovements` via Prisma. This violated strict boundaries, making `SalesService` a God class. If `Finance` or `Inventory` changes its internal logic, `SalesService` breaks.

### B. Weak Stock Consistency (Offline Collisions)
V1 strictly prohibited negative stock at the database level. However, if the POS goes offline, a cashier might physically sell an item that the DB thinks is out of stock (due to theft, miscount, or parallel e-commerce sale). When the POS reconnects and syncs, the DB constraint would reject the sale, but the cashier has already taken the cash. This creates an unresolvable financial black hole.

### C. Pricing Complexity (Offline Cart Evaluation)
V1 relied on the backend `RulesEngine` to evaluate complex cart promotions. If the POS is offline, it cannot calculate BOGO or tier discounts. If we force the server to recalculate upon sync, the server's total might not match what the cashier actually charged the customer offline.

## 2. Approved Good Decisions (To Keep)
- **Modular Monolith**: NestJS with strict module boundaries.
- **Data Persistence**: PostgreSQL + Prisma.
- **Idempotency**: Client-generated `UUIDv4` primary keys.
- **Immutable Ledgers**: Append-only `StockMovement` and `TreasuryReceipt`.
- **Materialized Views**: `StockLevel` for fast reads.

## 3. Mandatory Fixes (Architecture V2 Deltas)

### Fix 1: The Orchestrator Pattern (Sagas)
Remove cross-domain logic from `SalesService`. Introduce a dedicated `CheckoutOrchestrator` (e.g., in an `Orchestration` or `Application` layer). Domain services (`Sales`, `Inventory`, `Finance`) will expose transactional methods that accept a `Prisma.TransactionClient`. The Orchestrator manages the `$transaction` block and calls the isolated domain services.

### Fix 2: Offline Trust & Price Variance
The system must adopt a **"POS is Truth for Transactions"** policy for offline syncs. The offline POS dictates the final grand total. When the server syncs an offline order, it calculates the expected price. If there is a discrepancy, the server accepts the POS price but logs an `OfflinePriceVariance` for auditing. It must never reject a completed offline sale due to a price mismatch.

### Fix 3: Allowed Negative Virtual Stock
Remove the DB-level constraint preventing negative stock. Introduce the concept of **"Virtual Negative Stock"**. If an offline sale pushes stock below zero, the DB allows it, ensuring the financial transaction is recorded. A background job immediately flags the item and sends a `Shrinkage Alert` to the store manager to physically count and resolve the discrepancy.

## 4. Recommended Fixes
- **Reservation TTL**: Implement a TTL (Time-to-Live) on `StockLevel.reservedQuantity`. E-commerce reservations must automatically expire via a cron job (e.g., after 30 mins) if the payment gateway fails.
- **Read Replicas**: Separate analytical queries (Dashboards/Reports) from the primary transactional database to prevent POS slowdowns during heavy report generation.

## 5. Non-Breakable Architecture Rules
1. **Never Reject a Paid Offline Sale**: If cash was exchanged, the system MUST ingest the data. Flag it, alert it, but never drop it.
2. **No Direct DB Access Across Domains**: A module cannot import another module's Prisma models. It must call that module's Service.
3. **Audit Immutability**: No UPDATE or DELETE allowed on the `AuditLog`.

## 6. Pre-Requisites Before Continuing Implementation
1. Refactor `schema.prisma` to remove constraints blocking negative stock.
2. Refactor `sales.service.ts` to extract cross-domain logic into an Orchestrator.
3. Define the `PriceVariance` tracking mechanism.
