# Clothing Retail ERP & POS: Architecture & Product Definition

## 1. Executive Summary
This document defines a production-grade, modular monolith ERP and POS system tailored for a clothing retail business. It handles multi-branch inventory, variant-based products, omni-channel sales (in-store and online), and localized requirements (Argentina electronic invoicing). The system is designed for high availability, prioritizing offline-first capabilities for the POS to ensure business continuity during network outages, with a robust synchronization engine to maintain global state consistency.

## 2. Full Functional Scope
*   **Catalog Management:** Products, multi-dimensional variants (size, color, fit), categories, brands, dynamic pricing, and promotions.
*   **Inventory Control:** Multi-warehouse, multi-branch stock tracking, inter-branch transfers, physical stock takes, and low-stock alerts.
*   **Purchasing & Supply Chain:** Supplier management, purchase orders, goods receipts, and cost tracking (Weighted Average Cost).
*   **Sales & POS:** Offline-capable Point of Sale, barcode scanning, multiple payment methods, split payments, returns/exchanges, and cash register shifts (Z-reads).
*   **Customer Relationship Management (CRM):** Customer profiles, store credit, purchase history, and account balances.
*   **E-Commerce Integration:** Centralized order fulfillment, catalog sync, and online order management.
*   **Financials & Billing:** Accounts receivable, integrated payments (MercadoPago), and localized tax compliance (AFIP Argentina).
*   **Communications:** Automated transactional notifications via WhatsApp and Email.

## 3. Modules and Submodules
1.  **Core / Identity:** Authentication, Authorization (RBAC), Tenant/Branch Context, System Settings.
2.  **Catalog:** Products, Variants, SKUs, Barcodes, Pricing Rules.
3.  **Inventory:** Warehouses, Stock Movements, Stock Allocations.
4.  **Sales:** Point of Sale, Online Orders, Checkout Logic, Cash Management.
5.  **Purchasing:** Suppliers, Purchase Orders, Goods In.
6.  **Finance:** Invoices, Payments, Tax Engines (AFIP).
7.  **CRM:** Customers, Store Credit, Loyalty.
8.  **Notifications:** Communication Templates, Dispatcher (SMTP/WhatsApp).
9.  **Reporting:** Dashboards, Data Exports, Analytics.

## 4. Roles and Permissions
Implemented via a strict Role-Based Access Control (RBAC) system:
*   **Super Admin:** Unrestricted access across all branches.
*   **Store Manager:** Full access within a specific branch (inventory, shifts, cash drawer, local reports).
*   **Cashier:** Limited access to POS, shift opening/closing, customer creation, and basic returns within their assigned branch.
*   **Warehouse Operator:** Access limited to goods receipt, inter-branch transfers, and stock counts.
*   **E-Commerce Manager:** Access to online orders, catalog management, and fulfillment.

## 5. Business Rules
*   **Source of Truth:** The central server is the absolute source of truth for inventory. The POS holds a local replica that eventually synchronizes.
*   **Negative Stock:** Disallowed at the POS level unless explicitly overridden by a Store Manager. Online orders can allocate against incoming Purchase Orders (Backorders) if configured.
*   **Costing Method:** Weighted Average Cost (WAC) calculated at the time of Goods Receipt.
*   **SKU Uniqueness:** SKUs must be globally unique. Barcodes can have multiple per SKU (e.g., manufacturer barcode + internal barcode).
*   **Price Hierarchy:** Promotional Price > Customer Group Price > Branch-Specific Price > Global Base Price.

## 6. Modular Boundaries (VERY IMPORTANT)
The system is a **Modular Monolith**. Modules must strictly communicate via in-process dependency injection or an internal event bus. 
*   **No Cross-Database Joins:** Modules must not query each other's tables directly.
*   **Event-Driven State Changes:** When `Sales` completes an order, it publishes an `OrderCompleted` event. The `Inventory` module listens to this to deduct stock; the `Finance` module listens to generate an invoice.
*   **Data Duplication (Controlled):** `Sales` holds a read-only snapshot of the product price and name at the time of sale. It does not reference the `Catalog` product table for historical receipts.

## 7. Technical Architecture
*   **Pattern:** Modular Monolith with Domain-Driven Design (DDD).
*   **Backend:** Node.js with NestJS (TypeScript). NestJS enforces strict module boundaries natively.
*   **Database:** PostgreSQL (Relational integrity, JSONB for flexible variant attributes).
*   **Cache/Events:** Redis (Internal event bus, session management, catalog caching).
*   **Frontend (Backoffice):** React.js (Next.js) for admin interfaces.
*   **Frontend (POS):** React.js (Vite) configured as an installable Progressive Web App (PWA).

## 8. Offline Strategy
*   **Architecture:** Local-First PWA.
*   **Local Storage:** IndexedDB managed via RxDB (Reactive Database).
*   **Sync Mechanism:**
    *   On load, POS downloads a lightweight snapshot of Catalog and local Branch Inventory.
    *   During offline sales, transactions are written to a local IndexedDB queue.
    *   A Background Sync worker continuously attempts to push the queue to the backend via REST/WebSockets.
    *   **Conflict Resolution:** Last-Write-Wins for customer data; Append-Only for sales transactions (no conflicts possible, transactions are immutable events).

## 9. Core Data Model (High-Level)
*   `products` (id, base_sku, name, description, category_id)
*   `product_variants` (id, product_id, sku, barcode, attributes (JSONB: {size, color}), price)
*   `warehouses` (id, branch_id, name, type)
*   `inventory_levels` (variant_id, warehouse_id, quantity, reserved_quantity)
*   `orders` (id, branch_id, customer_id, total, status, type: POS/WEB, offline_reference_id)
*   `order_lines` (id, order_id, variant_id, quantity, unit_price, tax_amount)
*   `transactions` (id, order_id, payment_method, amount, status)
*   `audit_logs` (id, entity_type, entity_id, action, user_id, old_data, new_data, timestamp)

## 10. API Design (High-Level)
*   **Internal Backoffice APIs:** RESTful JSON APIs structured by module (`/api/v1/catalog/...`).
*   **POS Sync API:** Bulk sync endpoints and WebSocket connections for real-time invalidation (e.g., "Product X price changed, POS clients invalidate local cache").
*   **External Integration API:** Rate-limited REST APIs with API Key authentication for third-party tools (e.g., WooCommerce pushing orders).

## 11. Integrations
*   **MercadoPago:** Webhook-based integration for generating in-store QR codes and processing e-commerce checkouts.
*   **AFIP (Argentina):** Direct SOAP/REST API integration via a dedicated `TaxEngine` interface to fetch CAEs (Código de Autorización Electrónico) asynchronously so it doesn't block the POS checkout flow.
*   **WooCommerce:** Webhooks to receive orders; Cron-job/queue to push inventory updates.
*   **WhatsApp (Evolution API):** Queue-based worker to send electronic receipts and order status updates.

## 12. Audit and Traceability
*   **Pattern:** Append-only architecture for critical paths (Financials, Inventory Movements).
*   **Implementation:** Database triggers or Application-level Interceptors that write to an `audit_logs` table for every mutation (POST/PUT/DELETE) on core entities.
*   **Inventory Traceability:** Stock quantities are never directly updated. They are the sum of all `inventory_movements` (purchases, sales, adjustments).

## 13. Reporting
*   **Operational Reports:** Direct queries against the primary PostgreSQL database for real-time data (e.g., end-of-day Z-read).
*   **Analytical Reports:** Materialized views in PostgreSQL refreshed periodically (e.g., hourly sales aggregates, slow-moving inventory).
*   **Export:** CSV/Excel generation handled by background workers to prevent request timeouts on large datasets.

## 14. Technology Stack (Final Decision)
*   **Backend Framework:** NestJS (TypeScript).
*   **Database:** PostgreSQL 16.
*   **In-Memory Store:** Redis 7.
*   **Web/Admin UI:** Next.js (React), Tailwind CSS, Shadcn UI.
*   **POS UI:** Vite (React), Tailwind CSS, RxDB (Offline storage).
*   **Infrastructure:** Dockerized containers on AWS (ECS/Fargate) or generic VPS (Ubuntu + Docker Compose) for cost-sensitive initial deployment.

## 15. Backend Structure
```text
/src
  /core             # Auth, Guards, Interceptors, Base Entities
  /modules
    /catalog        # Products, Categories
    /inventory      # Stock, Warehouses, Movements
    /sales          # Orders, POS logic
    /finance        # Invoices, AFIP integration, Payments
    /crm            # Customers
  /infrastructure   # DB Config, Redis Config, Third-party SDK wrappers
```

## 16. Frontend Structure
**Monorepo Strategy (Turborepo):**
```text
/apps
  /backoffice       # Next.js app for management
  /pos              # Vite PWA for physical stores
/packages
  /ui               # Shared React components (Tailwind/Shadcn)
  /api-client       # Auto-generated Axios/Fetch clients from OpenAPI
  /types            # Shared TypeScript interfaces
```

## 17. Implementation Roadmap
*   **Phase 1 (Core Foundation & MVP):** Auth, Catalog, Basic Inventory, Local-only POS, Cash payments.
*   **Phase 2 (Finance & Localization):** MercadoPago QR, AFIP Electronic Invoicing, Z-Reads, Shift management.
*   **Phase 3 (Omnichannel):** WooCommerce integration, Advanced CRM, WhatsApp receipts.
*   **Phase 4 (Scale & Analytics):** Advanced reporting, Purchase Orders, Inter-branch transfers, Multi-warehouse routing.

## 18. MVP Definition
The absolute minimum viable product requires:
1.  Creation of products with size/color variants.
2.  Receipt of inventory into a single main branch.
3.  POS interface that works offline for up to 24 hours.
4.  Checkout process accepting Cash and generic Card (no terminal integration yet).
5.  Basic receipt printing (browser-based print dialog).
6.  End-of-day summary (Z-read) matching cash drawer.

## 19. Risks and Trade-offs
*   **Risk:** Offline sync conflict. *Trade-off:* We accept that if stock runs out globally while a POS is offline, the POS might oversell. The system will process the negative stock upon sync and flag it for manager resolution, rather than blocking the physical sale.
*   **Risk:** AFIP API downtime. *Trade-off:* Invoices will be queued locally on the backend. The POS issues a "Proforma" receipt. The legal invoice is generated and emailed to the customer via WhatsApp once AFIP is available.
*   **Risk:** Monorepo complexity. *Trade-off:* Higher initial setup cost for Turborepo, but guarantees type safety between frontend and backend, preventing runtime API mismatches.

## 20. Final Recommendation
Proceed with the **NestJS + PostgreSQL Modular Monolith** and the **Vite + RxDB PWA POS**. This architecture guarantees the robustness required for an ERP while managing the complexity of offline-first retail operations. Microservices are strictly avoided as they would introduce distributed transaction nightmares (e.g., coordinating a sale, inventory deduction, and invoice generation across network boundaries) which are unnecessary for this scale. Focus Phase 1 development entirely on perfecting the RxDB synchronization engine, as it is the architectural linchpin.
