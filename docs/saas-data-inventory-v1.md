# Vestix SaaS v1: inventario de datos y consumidores

- **Estado:** inventario preliminar basado en el schema Prisma revisado
- **Fecha:** 2026-11-23
- **Fuente:** `backend/prisma/schema.prisma` (71 modelos), `docs/PROJECT_MAP.md`, `docs/PROJECT_OPERATIONS.md` y prototipo `frontend/prototypes/redesign-v1/`.

Este documento acompaña [ADR SaaS-001](adr-saas-tenancy-v1.md). Es una matriz de diseño, no un cambio aprobado de schema ni un inventario completo de rutas por controlador. Antes de implementar cada fila hay que seguir el módulo activo desde su `*.module.ts`, controlador, servicio, jobs y pruebas; el mapa local advierte que hay implementaciones y DTOs duplicados o antiguos.

## Convenciones de alcance

- **T — Tenant:** pertenece a una empresa. Recomendación por defecto: agregar `tenantId` directo e indexado, aunque la fila también tenga un padre. Verificar relación padre-hijo dentro del mismo tenant.
- **U — Usuario global:** identidad de persona compartible entre tenants. Su alcance de negocio se determina por una membresía, no por su ID global.
- **P — Plataforma:** configuración o catálogo del proveedor SaaS. No contiene datos de negocio de clientes.
- **M — Mixto:** requiere separar defaults/plataforma de personalización/datos del tenant o distinguir auditoría administrativa.
- `tenantId + clave` significa reemplazar unicidad global para la clave de negocio con unicidad compuesta. Los UUID globales siguen siendo claves técnicas, pero no son un control de autorización.
- “Consumidores” identifica dominios y workers conocidos por el mapa del proyecto, no certifica por sí solo qué módulos/controladores están registrados actualmente.

## Identidad y núcleo (`core`)

| Modelo | Alcance y ancla tenant propuesta | Unicidad / relaciones a revisar | Consumidores principales |
|---|---|---|---|
| `User` | U: identidad, login y MFA globales. Empresa y permisos mediante `TenantMembership`; no fijar un único `branchId` como scope SaaS. | `email` puede seguir global si se aprueba identidad global. Migrar rol/sucursal al membership o a asignaciones explícitas; revisar referencias de auditoría y actor. | Identity/Auth, RBAC; todos los módulos que registran actor. |
| `Role` | T: roles asignables a una empresa. Roles de plataforma separados. | `name` actual global → `tenantId + name`; roles de sistema como catálogo P o seeds inmutables. | Identity/RBAC, PermissionsGuard. |
| `Permission` | P: definiciones de capacidades; asociación rol-permiso separada de la asignación del usuario. | Definir catálogo global único por `action + subject`; mover la relación actual `roleId` a `TenantRolePermission` o equivalente. | RBAC/guards, navegación y gates frontend. |
| `OutboxEvent` | T para eventos de dominio; eventos de plataforma en scope explícito separado. | Mantener idempotencia por tenant + aggregate + clave/evento según flujo; indexar tenant/status/createdAt. No confiar en tenant dentro de payload sin validarlo. | `core/outbox`, jobs de sync de stock/ecommerce/notificaciones. |
| `Branch` | T; columna directa. | `code` global → `tenantId + code`; garantizar como máximo una sucursal principal por tenant (índice parcial/regla transaccional). | Logistics/branches, POS/sales, finance/reportes. |
| `Warehouse` | T; columna directa y relación branch dentro del tenant. | `code` nullable global → unicidad por tenant y política explícita para múltiples null; validar `branchId` del mismo tenant. | Logistics/warehouses/inventory, procurement, POS. |
| `WarehouseLocation` | T; columna directa, padre warehouse. | `warehouseId + code` pasa a preservar tenant vía FK compuesto; índice tenant/warehouse. | Logistics/locations, escáner/recepción/stock. |
| `AuditLog` | M: separar auditoría del tenant y auditoría de plataforma; filas de tenant llevan tenantId. | Evitar lecturas cross-tenant por rol de cliente; retener append-only. Reconsiderar copia de PII/JSON en previous/newValue y sus límites. | `modules/audit`, interceptores y contexto de auditoría. |
| `IntegrationLog` | T por conexión/tenant; eventos de la plataforma aparte. | Indexar `tenantId + provider + createdAt/status`; no guardar credenciales. Asegurar límites/redacción del payload y respuesta. | Integrations, ecommerce, ARCA/pagos/notificaciones y sus processors. |
| `OfflineSyncLog` | T; derivar/verificar branch y user dentro de ese tenant. | `clientGeneratedId` actual global → clave idempotente tenant-aware (y branch si lo requiere el contrato); payload y conflictos tenant-scoped. | Offline sync engine, POS, soporte/auditoría. |
| `BackupJob` | M: backups de plataforma y export/restore de un tenant son operaciones distintas. | Guardar `tenantId?` sólo en trabajos tenant-scoped, un `scope` obligatorio y actor autorizado; rutas de archivos no accesibles por nombre. | Backups module, processor y guard de mantenimiento. |
| `WcVariantMapping` | T vía variante y conexión WooCommerce. | `variantId` único sólo permite un mapping; para varias tiendas usar tenant + connectionId + variantId y tenant + connectionId + external IDs. | Integración WooCommerce/outbox de catálogo-stock. |
| `MlVariantMapping` | T vía variante y conexión MercadoLibre. | Mismo patrón: connectionId/store en claves externas; el `variantId` solo puede restringir más de una cuenta por tenant. | Integración MercadoLibre y sincronización. |
| `ShopifyVariantMapping` | T vía variante y conexión Shopify. | `variantId` único debe revisarse para varios stores; tenant + connectionId + variantId/external ID. | Integración Shopify y sincronización. |
| `NotificationTemplate` | M: plantillas base P de sólo lectura y overrides T separados o con scope inequívoco. | `event + channel` actual global → unicidad dentro de platform-template o tenant; evitar colisión default/override. | Notifications templates/triggers y queue worker. |
| `NotificationLog` | T; tenant derivado de evento/orden/plantilla y validado. | Indexar tenant + event/status/createdAt; minimizar recipient, variables y error sensibles. | Notifications service/processor, bandeja y auditoría. |
| `StaffNotification` | T para notificaciones de operación; el user debe tener membership vigente. | Indexar tenant + userId + readAt/createdAt; no servir por ID a otro tenant. | Staff notifications/triggers, UI de bandeja. |
| `PromotionRule` | T; reglas y calendarios por empresa. | Claves e índices tenant + active/validFrom/validTo; condición/acción no debe referenciar IDs de otro tenant. | Catalog pricing/promotions y checkout/sales. |
| `PaymentIntent` | T; ligada a orden, provider y conexión del tenant. | Idempotencia/external reference única por tenant + provider + connection; validar orden y webhook al tenant correcto. | Payments integration, webhooks y sales checkout. |
| `OrderFulfillment` | T vía SaleOrder; recomendable tenantId directo y FK compuesto a orden. | `saleOrderId` único se mantiene tenant-safe; estados, tracking y relación Delivery scoped. | Sales orders fulfillment, shipping service/jobs. |
| `Delivery` | T vía fulfillment/orden, tenantId directo recomendado. | Tokens de tracking/driver pueden conservar unicidad global aleatoria, pero siempre limitan el acceso a esa entrega; carrier IDs únicos por conexión. | Shipping controllers/SSE, validación, tracking y transportista. |
| `DeliveryValidation` | T vía Delivery, tenantId directo recomendado. | Índices tenant + delivery + validatedAt; metadata no debe ampliar acceso a otra entrega. | Delivery validation/driver app. |
| `CartHold` | T; branch, warehouse y customer deben compartir tenant. | Indexar tenant/status/expiresAt; definir idempotencia/TTL y validar que líneas sólo incluyan variantes de ese tenant. | POS/cart, reservas/inventario, jobs de expiración si aplica. |

## Catálogo y precios (`catalog`)

| Modelo | Alcance y ancla tenant propuesta | Unicidad / relaciones a revisar | Consumidores principales |
|---|---|---|---|
| `Category` | T; jerarquía padre/hijos dentro del tenant. | `name` global → tenant + nombre (definir si repetición entre ramas se permite); FK parent con tenant. | Catalog taxonomy/products, tienda y filtros POS/reportes. |
| `Brand` | T; puede vincularse a proveedor(es) del mismo tenant. | `name` global → tenant + nombre. El schema actual no relaciona Brand con Supplier; decidir proveedor principal 1:N o abastecimiento multi-proveedor N:M antes de crear FK/tabla puente. | Catalog taxonomy/products y compras/proveedores. |
| `Product` | T; categoría y marca deben ser del mismo tenant. | `baseSku` global → tenant + SKU; revisar categoría requerida y archivado/soft-delete. | Products/catalog, POS, inventory, purchases, storefront e integraciones. |
| `ProductVariant` | T directa o denormalizada desde Product con FK compuesto. | `sku` y `barcode` globales → tenant + SKU/barcode según política; revisar barra opcional, historial y mappings. | Catalog variants/identifiers, inventory, POS, purchasing, sync. |
| `ProductBarcode` | T vía variante, tenantId directo si se filtra/RLS por tabla. | `barcode` global → tenant + barcode; verificar variante del mismo tenant. | Identifiers/barcode lookup, POS, recepción y sync offline. |
| `LabelTemplate` | M: templates de sistema P sólo lectura y copias/customizaciones T. | `isSystem` no debe dar acceso global implícito; definir unicidad por scope/tenant y propiedad de archivo/layout. | Catalog labels/ZPL, ajustes de impresión y usuarios. |
| `Attribute` | T. | `name` global → tenant + nombre; categoría/valores dependen de reglas de producto. | Taxonomy, editor de producto, generador de variantes. |
| `AttributeValue` | T vía atributo, directo para RLS. | `attributeId + value` único dentro del tenant; definir case/acentos y proteger valores usados por variantes. | Taxonomy, variantes, POS y filtros de catálogo. |
| `ProductComboLine` | T vía producto padre y variante hija. | Asegurar padre/hijo mismo tenant; añadir unicidad tenant + parentProductId + childVariantId si una línea por componente. | Productos combo, precios y checkout/inventory. |
| `ProductCollection` | T. | Definir tenant + nombre/temporada/año si se busca duplicado; validar fechas/estado. | Catalog collections, campañas/storefront. |
| `ProductCollectionItem` | T vía colección y producto. | Preservar unique `collectionId + productId` dentro del tenant con FKs compuestos. | Catalog collections y storefront. |
| `ProductBatch` | T vía variante, tenantId directo recomendado. | Preservar `variantId + batchNumber` tenant-scoped; validar fecha/lote de producto. | Batches, stock levels/movements, recepción y vencimientos. |
| `PriceList` | T; lista predeterminada única por tenant y contexto de venta. | `name` global → tenant + nombre; definir tenant + code; índice/regla para un default activo por scope y moneda/tipo si corresponde. | Pricing, POS/sales, customers, reports y carga masiva. |
| `PriceListEntry` | T vía lista y variante, tenantId directo recomendado. | Preservar lista + variante dentro del tenant; validar moneda, fechas y pertenencia común. | Pricing service, catálogo, POS y promociones. |
| `PriceHistory` | T vía variante/lista, tenantId directo recomendado. | Indexar tenant + variant + createdAt; `changedBy` debe ser miembro autorizado. | Price history, auditoría, reportes y bulk changes. |

## Clientes y ventas (`sales`)

| Modelo | Alcance y ancla tenant propuesta | Unicidad / relaciones a revisar | Consumidores principales |
|---|---|---|---|
| `Customer` | T para clientes del ERP. Si más adelante hay identidad de comprador compartida entre tiendas, modelarla aparte del perfil comercial tenant-owned. | `taxId` nullable global → tenant + taxId; `priceListId` del mismo tenant; preservar datos sensibles mínimos. | Customers/loyalty, pricing, sales/POS, storefront identity con boundary separado. |
| `LoyaltyAccount` | T vía customer; tenantId directo recomendado. | `customerId` único se mantiene dentro del tenant; validar no ligar cuenta a cliente de otra empresa. | Loyalty/benefits, checkout y customer account. |
| `GiftCard` | T; `customerId` y `accountId` tenant-scoped. | `code` único dentro del tenant o token global aleatorio; token de verificación sigue impredecible y de alcance mínimo. | Gift cards/redemptions, sales/POS, finance. |
| `SaleOrder` | T; branch/warehouse/customer/cash shift/cuentas del mismo tenant. | UUID técnico global; agregar tenant/time/status/branch indexes e idempotencia tenant-aware; serie fiscal separada. | Sales service, POS, checkout orchestrator, storefront, sync. |
| `ShippingAddress` | T vía orden, tenantId directo recomendado por datos de contacto/PII. | `saleOrderId` único se conserva en tenant; API no permite acceso aislado por address ID. | Sales checkout, fulfillment y shipping. |
| `SaleOrderVariance` | T vía orden. | `orderId` único dentro del tenant; acceso sólo por permiso de conciliación/auditoría. | Offline sync/checkout reconciliation, sales audit. |
| `OrderLineItem` | T vía orden; `variantId/categoryId` deben ser del mismo tenant; historial snapshot puede quedar inmutable. | Índices tenant + order; proteger integridad de SKU/precio/costo histórico y retorno. | Sales/checkout, inventory, reports, returns. |
| `SaleOrderPayment` | T vía orden y `PaymentMethod` del tenant. | Índices tenant + order + createdAt; referencia de pago idempotente dentro de conexión/provider. | Sales payments, finance, payment webhook. |
| `SaleReturn` | T vía SaleOrder/branch. | Índice tenant + saleOrder/status/createdAt; autorización para devolución y reembolso. | Returns, sales, inventory, finance. |
| `SaleReturnLine` | T vía return y order line; validar ambos padres/variante del mismo tenant. | Índices tenant + return/orderLine; restricciones de cantidades acumuladas se validan transaccionalmente. | Returns, inventory movements, refunds. |

## Inventario (`inventory`)

| Modelo | Alcance y ancla tenant propuesta | Unicidad / relaciones a revisar | Consumidores principales |
|---|---|---|---|
| `InventoryMovement` | T vía variante y warehouses de origen/destino; tenantId directo recomendado para ledger/RLS. | Índices tenant + variant/time y tenant + reference/type; validar origen/destino/variant same tenant; ledger inmutable salvo corrección compensatoria. | Inventory movement service, receiving, transfers, sales, batch jobs. |
| `StockLevel` | T; variante, depósito, batch y branch del mismo tenant. | Schema actual declara unique compuesto `variantId + warehouseId + batchId` e índice por variante. Objetivo: unique tenant + variant + warehouse + batch; resolver el caso `batchId NULL` según la semántica de unicidad de PostgreSQL y el stock sin lote. | Inventory service, reservations, POS availability, reports. |
| `StockReservation` | T vía nivel/variante/orden/cart. | Indexar tenant + status/expiresAt; todos los vínculos dentro de tenant; idempotencia de reservas. | Reservations, checkout, e-commerce carts, expiration job. |
| `StockTransfer` | T; warehouses source/dest del mismo tenant. | Añadir tenant + estado/fecha; `trackingNumber` puede ser único por tenant si actúa como referencia del negocio. | Transfers module, stock jobs, UI/logística. |
| `StockTransferLine` | T vía transfer y variant. | FK compuestas transfer/variant; añadir unique transfer + variant sólo si el dominio no permite líneas repetidas. | Transfers, inventory movements y recepción. |

## Compras (`purchasing`)

| Modelo | Alcance y ancla tenant propuesta | Unicidad / relaciones a revisar | Consumidores principales |
|---|---|---|---|
| `Supplier` | T. | `taxId` global nullable → tenant + taxId; normalizar CUIT y definir política de duplicados; marca no está hoy modelada como relación. | `suppliers.service`, purchasing, AP/current accounts, brand onboarding. |
| `PurchaseOrder` | T; supplier, destination warehouse, user/branch coherentes en tenant. | Índices tenant + status/date/supplier; añadir número de orden tenant-scoped si existe o se agrega. | `purchasing.service`, approval, import/replenishment jobs. |
| `POLineItem` | T vía orden, variante y recepción. | FK compuestas garantizan que variante corresponde al tenant; conservar snapshots de costo/descuento y cantidades auditables. | Procurement, receipt processing, inventory/costing. |
| `GoodsReceipt` | T vía orden/warehouse/receivedBy. | Índices tenant + status/date; validar orden y warehouse del tenant, recepción parcial idempotente. | `goods-receipt.service`, purchasing, inventory and batch jobs. |
| `GoodsReceiptLine` | T vía receipt/PO line/variant. | FKs compuestas same tenant y misma línea de compra; aplicar idempotencia por recepción externa cuando aplique. | Goods receipt, inventory movements, batches, costing. |

## Finanzas y facturación (`finance`)

| Modelo | Alcance y ancla tenant propuesta | Unicidad / relaciones a revisar | Consumidores principales |
|---|---|---|---|
| `Invoice` | T vía orden y emisor fiscal tenant; certificados y CUIT aislados por empresa. | Clave fiscal debe diseñarse por tenant + CUIT emisor + punto de venta + tipo/número según ARCA; `cae` no reemplaza idempotencia. | Invoicing/ARCA queue, sales, reports, downloads. |
| `FinancialAccount` | T; sucursal opcional del mismo tenant. | Nombre/código únicos dentro de tenant sólo si regla funcional lo requiere; evitar balances compartidos entre empresas. | Finance accounts/payments/costing, POS, reports. |
| `FinancialTransaction` | T vía account; referencias cruzadas scoped. | Unique/idempotency key tenant-aware; indexar tenant + account + createdAt. | Finance payments, treasury, expenses, account adjustments. |
| `PaymentReceipt` | T vía cuenta. | Referencia externa única por tenant/provider si representa idempotencia; scope de acceso a comprobantes. | Finance receipts, payments, reports. |
| `TreasuryReceipt` | T vía cuenta/orden/cliente según caso. | Referencias se validan por tenant; append-only si el evento es un asiento confirmado. | Finance treasury, checkout, current accounts. |
| `CashRegister` | T vía branch. | `code` global → tenant + branch + code; estado de caja y ownership no pueden cruzar empresa. | POS, cash shifts, finance. |
| `PaymentMethod` | T; caja/cuenta del mismo tenant. | Definir unique tenant + name/type sólo si negocio lo requiere; provider tokens/config cifrados y separados por tenant. | POS, sales checkout, finance, payment integrations. |
| `CashShift` | T vía cashRegister; opened/closed users son miembros. | Regla de una apertura activa por caja (índice parcial/regla transaccional); indexar tenant + status/fecha. | POS, cash, sales, expense and closeout jobs. |
| `CurrentAccountMovement` | T vía cuenta financiera/entidad comercial. | Indexar tenant + entityType/documentType/reference; unique sólo para eventos idempotentes confirmados. | Finance current account, supplier/customer ledger, reports. |
| `ExpenseCategory` | T jerárquica. | `name` y `code` globales → tenant + name/code; padre mismo tenant. | Finance expenses and reporting. |
| `Expense` | T; categoría, autor, turno, sucursal y cuenta same tenant. | `financialTransactionId` unique queda tenant-safe; receipt/voucher storage scoped. | Finance expenses, audit, cash shift and reports. |
| `AccountAdjustment` | T; cuenta, aprobador y transacción same tenant. | `financialTransactionId` unique scoped; mantener segregación de creador/aprobador y audit trail. | Finance adjustment workflow, accounting, audit. |

## Configuración SaaS (`settings`)

| Modelo | Alcance y ancla tenant propuesta | Unicidad / relaciones a revisar | Consumidores principales |
|---|---|---|---|
| `SystemSettings` | M: separar configuración de plataforma de settings por empresa; `tenantId` único para configuración tenant. | El patrón actual `id` singleton no vale para múltiples empresas; secciones ARCA/POS/storefront/offline referencian secretos cifrados tenant-scoped. | Settings service, setup, POS, ARCA, notifications, PWA. |

Las conexiones y credenciales de WooCommerce, MercadoLibre y Shopify deben pertenecer a settings del tenant. Los modelos de mappings y sus consumers están inventariados en la sección `core`.

## Resumen de trabajo derivado

1. **Crear entidades SaaS:** `Tenant`, `TenantMembership`, role/permission boundary y catálogo de plan/entitlements. Estas entidades no existen hoy en Prisma.
2. **Definir backfill:** mapear todas las filas existentes a un tenant inicial; separar templates/settings globales; no copiar credenciales o secretos a un tenant sin reglas de cifrado y acceso.
3. **Completar relaciones:** agregar tenant scope a entidades raíz y tablas satélite; reforzar FKs compuestas para variantes, ramas, almacenes, cuenta, orden y líneas.
4. **Resolver unicidades antes de migrar:** detectar colisiones potenciales por tenant y decidir CUIT/email, SKU/barcode, número fiscal, códigos de sucursal/depósito, mapeos externos e idempotencia offline.
5. **Auditar consumidores:** API HTTP, workers BullMQ, cron, outbox, webhook, reportes/exportación, uploads, storefront tokens, POS offline, Redis y backups.
6. **Validar dos tenants:** fixtures sintéticos separados y pruebas de aislamiento positivas y negativas para cada familia de modelo; para RLS, comprobar el rol de aplicación y el reuse de conexiones.

## Supuestos y puntos por resolver

- Se consideran tenant-owned las entidades operativas; no se asume que `isSystem`, una relación con Branch o un identificador aleatorio haga el dato globalmente seguro.
- El usuario global por email y las membresías multiempresa son recomendación, no decisión aprobada.
- La cardinalidad marca-proveedor del prototipo aún no está reflejada en Prisma. Validar si existe proveedor principal único o abastecimiento multi-proveedor.
- La matriz asigna consumidores a dominios del mapa; antes de tocar código, comprobar cada `*.module.ts`, ruta registrada, DTO actual y prueba relevante.
- La lista de modelos se calculó del schema vigente al elaborar esta propuesta y debe regenerarse si el schema cambia.

## Referencias

- [ADR SaaS-001: aislamiento multiempresa](adr-saas-tenancy-v1.md)
- [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- `backend/prisma/schema.prisma`, `docs/PROJECT_MAP.md`, `docs/PROJECT_OPERATIONS.md`.
