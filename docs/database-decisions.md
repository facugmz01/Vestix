# Database Decisions & Strategy

## 1. Database Strategy
- **Engine**: PostgreSQL 16+.
- **Justification**: We selected PostgreSQL because of its strict ACID compliance, MVCC (Multi-Version Concurrency Control) to ensure POS writes never block analytical reads, JSONB support for unstructured integration metadata (e.g., AFIP error traces, offline payload diffs), and robust constraint capabilities.

## 2. Table & Domain Mapping
The database is strictly partitioned by domain context:
- **Auth/RBAC**: `User`, `Role`, `Permission`.
- **Catalog**: `Product`, `ProductVariant` (SKUs). Base products hold metadata; Variants hold pricing and physical tracking.
- **Inventory**: `Warehouse`, `StockMovement` (Immutable Ledger), `StockLevel` (Materialized View).
- **Sales**: `SaleOrder`, `OrderLineItem`, `SaleOrderVariance` (Offline mismatch tracking).
- **Purchasing**: `Supplier`, `PurchaseOrder`, `POLineItem`.
- **Finance**: `TreasuryReceipt`, `Customer` (Current Account ledgers).
- **Fiscal**: `Invoice` (AFIP electronic billing).
- **Infrastructure**: `AuditLog`.

## 3. Relational Schema Decisions
- **Primary Keys**: 100% `UUIDv4`. Integers (`SERIAL`) are banned because they prevent secure, collision-free offline data generation.
- **Foreign Keys**: Explicit indexing on all FKs to prevent full-table scans during relational joins (e.g., `variantId` on `OrderLineItem`).
- **Composite Unique Keys**: Enforced on `StockLevel (variantId, warehouseId)` to ensure only one real-time state row exists per physical location per item.

## 4. Stock Consistency Strategy (V2 Hardened)
- **Immutable Ledger**: Physical stock is never updated arbitrarily; a `StockMovement` row is inserted.
- **Virtual Negative Stock**: `StockLevel.physicalQuantity` is ALLOWED to go negative at the DB level. If an offline POS sells a shirt that the DB thinks is out of stock, we must accept the financial transaction (cash was taken) and record a negative stock state. This triggers a `Shrinkage Alert` for managerial review instead of breaking the offline sync.

## 5. Pricing Consistency Strategy (Offline Trust)
- **POS is Truth**: The `SaleOrder.grandTotal` is populated directly by the offline POS. 
- **Price Variances**: During sync, the backend RulesEngine recalculates the order. If the server total differs from the offline POS total (due to stale cached pricing or offline rule limitations), a `SaleOrderVariance` record is inserted linking to the order. The original sale is **accepted**, ensuring the business flow is not interrupted.

## 6. Audit & Offline Support Strategy
- **Audit Logging**: `AuditLog` captures `userId`, `action`, `resource`, and a JSONB diff. It is strictly append-only.
- **Offline Idempotency**: All operational mutations utilize `UPSERT` or checking via the `id` field provided by the frontend.
- **Time Tracking**: `SaleOrder` differentiates between `createdAt` (when the cashier clicked checkout offline) and `syncedAt` (when the server received it).
