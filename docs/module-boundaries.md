# Module Boundaries

## 1. Module List
The ERP is divided into the following bounded contexts:
1. **Auth & RBAC**: Identity, Sessions, Permissions.
2. **Catalog**: Products, Variants, Categories, Brands, Barcodes.
3. **Inventory**: Warehouses, Stock Movements, Stock Levels, Internal Transfers.
4. **Sales**: Sale Orders, Line Items, Quotations, Reservations, Returns.
5. **Purchasing**: Suppliers, Purchase Orders, Goods Receipts.
6. **Finance**: Treasury Accounts, Receipts, Customer Account Ledgers (Credit).
7. **POS**: Hardware integration, Shift/Session management, Quick Sales.
8. **Pricing**: Rules Engine, Promotions, Price Lists.
9. **Integrations**: AFIP (Invoicing), WooCommerce, MercadoPago.
10. **Notifications**: Email (SMTP/Sendgrid), WhatsApp Evolution API.
11. **Settings**: System-wide configurations.
12. **Audit**: Immutable change tracking.

## 2. Module Boundaries & Rules
To prevent the "Big Ball of Mud" anti-pattern, strict boundaries are enforced:

### Database Access
- **Encapsulation**: A module may ONLY inject and query its own Prisma models. 
- **Violation**: `SalesService` directly updating `this.prisma.stockLevel.update(...)`.
- **Correction**: `SalesService` MUST call `InventoryService.recordMovement(...)`.
- **Exception**: Cross-module orchestrators utilizing `$transaction(tx)` may pass the transaction client downwards to ensure atomicity.

### Data Flow
- **Downstream Dependency**: Modules must not have circular dependencies. 
  - `Sales` depends on `Catalog`, `Inventory`, and `Finance`.
  - `Inventory` knows nothing about `Sales`. It only knows about `Movements`.
  
### API Contracts
- Controllers are the ONLY entry point for external data. Services must never parse raw HTTP Request objects.
- DTOs (Data Transfer Objects) are strictly validated at the Controller boundary.

### Cross-Cutting Concerns
- `Audit` and `Notifications` are infrastructural modules. They are injected widely but they never inject domain modules back.
