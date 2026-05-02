# Architecture Overview

## 1. Executive Summary
This system is a production-grade, omnichannel Retail ERP designed specifically for the clothing industry. It unifies Point of Sale (POS), e-commerce, multi-branch inventory management, B2B/B2C sales, purchasing, and financial ledgers into a single cohesive platform. Designed with an "offline-first" POS capability, it guarantees that physical stores can continue selling during internet outages, syncing seamlessly when connectivity is restored.

## 2. Backend Architecture
- **Framework**: NestJS (TypeScript) utilizing a Modular Monolith architecture.
- **Pattern**: Domain-Driven Design (DDD) principles. Modules are highly encapsulated.
- **Transactions**: Complex cross-module mutations (e.g., Checkout) are orchestrated using the Unit of Work pattern (Prisma `$transaction`) to ensure ACID compliance.

## 3. Frontend Architecture
- **Framework**: React 18 + Vite (TypeScript).
- **State Management**:
  - **Server State**: TanStack Query (React Query) for caching, invalidation, and background fetching.
  - **Client/Offline State**: Zustand with IndexedDB (`idb-keyval`) persistence for the durable offline queue and cart management.
- **Delivery**: Progressive Web App (PWA) enabling installation on POS terminals and background service worker caching.

## 4. Database Strategy
- **Engine**: PostgreSQL 16+.
- **ORM**: Prisma Client.
- **Primary Keys**: Client-generated `UUIDv4` to enable safe offline data creation and strict idempotency.
- **Design Pattern**: 
  - **Immutable Ledgers**: `StockMovement` and `TreasuryReceipt` are append-only.
  - **Materialized Views**: `StockLevel` incrementally aggregates movements for lightning-fast reads.
- **Concurrency**: Relies on PostgreSQL MVCC and `Serializable` transaction isolation for critical financial pathways.

## 5. API Strategy
- **Style**: RESTful JSON APIs.
- **Validation**: Strict boundary validation using `class-validator` and `class-transformer`.
- **Security**: JWT tokens (HttpOnly cookies recommended for production), Default-Deny RBAC route guards.
- **Idempotency**: All `POST` endpoints creating operational records require a client-generated UUID to prevent duplicate processing.

## 6. Offline Strategy
- **Cache**: Core catalog (products, variants, prices) is synced locally to IndexedDB upon POS login.
- **Queue**: When offline, the POS pushes operations (Sales, Customers) to a durable Zustand queue.
- **Replay**: `useSyncEngine` hook detects network restoration and drains the queue sequentially.
- **Conflict Resolution**: Server is the absolute source of truth for pricing and inventory logic. Conflicting UUIDs return `200 OK` (idempotent), while logic failures (e.g., out of stock) trigger a UI conflict resolution prompt.

## 7. Audit Strategy
- **Immutable Log**: All state mutations generate an `AuditLog` entry.
- **Payload**: Captures `userId`, `action`, `resource`, and a JSONB `diff` (before and after state).
- **Compliance**: PII and sensitive data (passwords, tokens) are explicitly redacted before writing to the database.

## 8. Roadmap
1. **Data Layer Stabilization**: Finalize Prisma schema and replace all mock services.
2. **API Alignment**: Guarantee strict DTO contracts between React and NestJS.
3. **Offline Resilience**: Solidify IndexedDB queue and background sync engine.
4. **Integrations**: Implement AFIP (Electronic Invoicing), MercadoPago, WooCommerce.
5. **Production Hardening**: Rate limiting, CI/CD pipelines, managed PostgreSQL tuning.

## 9. Minimum Viable Product (MVP)
The MVP scopes down the complexity to guarantee a rapid time-to-market:
- Single Branch / Single Warehouse operation.
- Basic Catalog (Products, Variants, Barcodes).
- Offline-capable POS (Cash and simple Credit Card inputs).
- Manual Stock Adjustments and Sales decrements.
- Basic RBAC (Admin vs Cashier).

## 10. Risks
- **Offline Inventory Depletion**: Two offline stores selling the last item. Requires clear operational handling of negative virtual stock upon sync.
- **AFIP Latency**: Synchronous calls to government APIs will hang the POS. Must be decoupled via message queues.
- **Data Volume**: Massive inventory movement ledgers slowing down queries. Requires careful composite indexing.

## 11. Production Recommendation
Deploy the modular monolith as Docker containers orchestrated via AWS ECS or Kubernetes. Use a fully managed PostgreSQL instance (e.g., AWS RDS or Aurora) configured for high availability. Offload integration workloads (AFIP, Notifications) to Redis-backed BullMQ workers to keep HTTP request latencies under 200ms.
