# V2 Architecture Refinement: Production Readiness

## 1. Diagnosis
The V1 architecture suffers from naive optimism. While the modular monolith is correct, the offline strategy is overly ambitious and will fail under weak network conditions. The pricing hierarchy is too complex for an initial release, and the event-driven internal communication lacks transactional guarantees, which will inevitably lead to phantom inventory or missing invoices. We are trying to build SAP in phase 1. This needs aggressive pruning.

## 2. Approved Decisions
*   **Modular Monolith:** Node.js/NestJS + PostgreSQL.
*   **Append-Only Inventory:** `inventory_movements` table is the sole source of truth for stock.
*   **Vite/React PWA for POS:** Local-first approach is correct, but execution must be simplified.
*   **Weighted Average Cost:** Confirmed for accounting.

## 3. Problems
*   **Module Coupling:** "Events" without an Outbox Pattern mean a database transaction might commit, but the event fails to emit (or vice versa), leading to data inconsistency.
*   **Offline Complexity:** Syncing a "full local replica" of the catalog to a low-end POS tablet will crash the browser due to IndexedDB limits and memory constraints.
*   **Pricing Complexity:** Calculating dynamic layered promotions offline is mathematically complex, error-prone, and heavily reliant on perfectly synced state.
*   **Stock Reconciliation:** Allowing "negative stock" offline creates a reconciliation nightmare. Is it theft? A missing goods-receipt? An incorrect barcode?
*   **Premature Production:** The MVP is too fat. E-commerce and CRM loyalty cannot be in Phase 1.

## 4. Mandatory Fixes
*   **Implement Transactional Outbox Pattern:** Internal events must be saved to an `outbox_events` table within the exact same DB transaction as the business entity mutation. A background worker then processes the outbox.
*   **Idempotency Keys:** Every POST/PUT from the offline POS must include a client-generated UUID (`idempotency_key`) to prevent duplicate billing or ghost orders on network retries.
*   **Scope Offline Catalog:** The POS will ONLY sync products that have physical stock in *that specific branch*, plus the top 200 selling items globally. It will NOT sync the entire global catalog.
*   **Strict Offline Pricing:** Complex promotions are disabled offline. Offline mode only supports Base Price and manual percentage discounts applied by an authorized Manager.

## 5. Recommended Fixes
*   **Double-Entry Inventory:** Model inventory exactly like accounting. Every movement has a Source and a Destination (e.g., Supplier -> Warehouse A, Warehouse A -> Customer, Warehouse A -> Shrinkage). There is no "delete" or "set quantity".
*   **Replace RxDB with Dexie.js + Custom SyncWorker:** RxDB is too heavy and magical. Use raw Dexie.js for IndexedDB and write a deterministic, explicit sync queue worker.

## 6. Open Risks
*   **AFIP Latency:** Argentina's tax API frequently goes down. Queued electronic invoicing will result in customers leaving the store without a legal CAE on their physical receipt. (Mitigation: Print Proforma, send legal PDF later via WhatsApp).
*   **Z-Read (Shift Close) Partitions:** If the network dies right as the cashier closes the register, the server won't know the shift ended, potentially blocking the next shift or causing data collisions.

## 7. Non-Breakable Rules
1.  **No Cross-Database Joins:** Modules (e.g., Sales and Catalog) may share the Postgres instance, but they use separate DB schemas (`sales.orders`, `catalog.products`). They CANNOT `JOIN` across schemas.
2.  **No Direct Stock Overwrites:** Stock quantities are NEVER updated via `UPDATE inventory SET qty = X`. They are purely calculated views (materialized or real-time sum) of `inventory_movements`.
3.  **Client-Dictated UUIDs:** The POS dictates the IDs (UUIDv4) for orders and transactions upon creation to guarantee safe network retries.

## 8. Module Corrections
*   **Finance is purely Reactive:** `Sales` processes the checkout. `Sales` writes an Outbox event. `Finance` reads the event and handles AFIP integration and MercadoPago reconciliation independently.
*   **Catalog owns Structure, Sales owns History:** An `order_line` must deep-copy the `product_name`, `sku`, and `unit_price` at the exact moment of sale. If the Catalog product is later deleted or renamed, the historical receipt remains fully intact.

## 9. Stock Corrections
*   **Eliminate "Negative Stock" concept:** If the POS sells an item that the server thinks has 0 stock, the server sync engine creates an automatic `POS_CORRECTION` movement to bring the stock to 1, then records the sale to bring it to 0. This forces a reportable audit trail of inventory discrepancies rather than sweeping negative numbers under the rug.
*   **Allocations (Reservations):** E-commerce orders must create a temporary "Reserved" state. Total Stock = Available + Reserved. If an order is unpaid after 15m, the reservation is released.

## 10. Offline Corrections
*   **Append-Only Sync Queue:** The offline POS only queues immutable commands (e.g., `CreateOrderCommand`). It never attempts to sync updates or deletes of already-synced orders.
*   **One-Way Catalog Sync:** The POS never modifies the catalog. It is a strictly read-only consumer of catalog data.

## 11. Pricing Corrections
*   **V1 Pricing Model:** Flat. `base_price` on the Variant. No complex "Buy 1 Get 1" logic in V1. Use simple line-item discounts applied explicitly by the user.
*   **Promotions Engine (V2+):** Defer all advanced promotional logic until V2, and isolate it in a dedicated Rules Engine service.

## 12. Integration Corrections
*   **Asynchronous Webhooks:** WooCommerce and MercadoPago webhooks must immediately respond `200 OK` and drop the payload into a Redis BullMQ queue. Processing and database writes happen asynchronously to prevent third-party timeouts.

## 13. Priority List
1.  Establish Monorepo, DB Schemas, and CI/CD pipelines.
2.  Implement Core Identity (Auth/RBAC) and Base Data Model.
3.  Implement Double-Entry Inventory Engine (API/Tests only, no UI).
4.  Implement Catalog & Pricing (Read-only for POS).
5.  Build the POS PWA Sync Engine (Dexie.js -> API).
6.  Sales Checkout & Cash Register Shifts.
7.  AFIP Integration (Queued).

## 14. Pre-Backend Fixes
*   Define the exact JSON payload for the POS-to-Server Sync API. This contract must be rigidly locked before backend coding begins.
*   Configure NestJS and TypeORM/Prisma to support strict schema separation (e.g., configuring multiple DB connections or explicit schema prefixes) to enforce the "No Cross-Database Joins" rule.

## 15. Pre-Frontend Fixes
*   Strip out RxDB. Configure Vite with a raw Service Worker and Dexie.js.
*   Build a highly visible, robust "Sync Status" indicator component. Store staff must know exactly how many transactions are pending in the local queue at all times.
