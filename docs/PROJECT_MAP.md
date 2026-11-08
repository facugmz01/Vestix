# Vestix: mapa por áreas

Complemento de [PROJECT_MEMORY.md](PROJECT_MEMORY.md). Rutas relativas a la raíz. Revisado 2026-11-03.

## Backend

Los dominios funcionales viven en `backend/src/domains/`; infraestructura en `core/`; módulos transversales en `modules/`. Confirmar clases activas en cada `*.module.ts`: existen nombres similares y DTOs antiguos fuera de las rutas principales.

| Área | Ubicación bajo backend/src | Responsabilidad / archivos guía |
|---|---|---|
| Identidad | `domains/identity/`, `core/rbac/` | Auth, usuarios, roles, sucursales de usuario, TOTP; `auth.service.ts`, `jwt.strategy.ts`, `guards/permissions.guard.ts`, `permission-match.util.ts` |
| Setup | `domains/setup/` | Configuración inicial; `setup.service.ts`, `setup.controller.ts`; seed en `backend/prisma/seed.ts` |
| Catálogo | `domains/catalog/` | `services/products.service.ts`, `taxonomy.service.ts`, `media.service.ts`, `collections.service.ts`; variantes, atributos, marcas, categorías, combos, imágenes |
| Precios | `domains/catalog/` | `pricing.service.ts`, `rules-engine.service.ts`, `services/promotions.service.ts`, `services/price-history.service.ts` |
| Identificadores y etiquetas | `domains/catalog/` | `identifiers.service.ts`, `utils/`, `labels/`: códigos, plantillas, render y ZPL |
| Ventas | `domains/sales/` | `sales.service.ts`, `checkout.orchestrator.ts`, `repositories/sale-order.repository.ts`; cotizaciones, confirmación, cancelación, importaciones |
| POS | `domains/sales/` | `pos.service.ts`, `pos.controller.ts`, `pos-qr-store.service.ts`, `pos-webhooks.controller.ts`, `cash-registers.controller.ts` |
| Tienda | `domains/sales/` | `storefront.controller.ts`, `storefront-auth.controller.ts`, `storefront-customer-identity.service.ts`, `storefront-coupons.controller.ts`, `mercadopago.service.ts` |
| Clientes y beneficios | `domains/sales/` | `customers.service.ts`, `loyalty/`, `gift-cards/`, `returns/` |
| Sincronización | `domains/sales/` | `offline.controller.ts`, `sync-engine.service.ts`, `conflict-resolution.service.ts` |
| Inventario | `domains/logistics/` | `inventory.service.ts`, `stock-movement.service.ts`, `reservations/`, `reservation-expiry.job.ts`, `transfers/` |
| Organización física | `domains/logistics/` | `branches.service.ts`, `warehouses.service.ts`, `locations.service.ts` |
| Compras | `domains/procurement/` | `purchasing.service.ts`: órdenes, compra directa, pagos, importaciones, reposición; `receipts/goods-receipt.service.ts`, `suppliers.service.ts` |
| Finanzas | `domains/finance/` | `accounts.service.ts`, `payments.service.ts`, `current-accounts.service.ts`, `finance-documents.service.ts`, `account-adjustments.service.ts`, `costing.service.ts`, `cash/`, `expenses/` |
| ARCA / AFIP | `domains/invoicing/` | `invoicing.service.ts`, `afip.service.ts`, `afip.producer.ts`, `afip.processor.ts`; SDK AFIP, certificados y comprobantes |
| Entregas | `domains/shipping/` | `shipping.service.ts`, `delivery-validation.service.ts`, `geocoding.service.ts`, controllers SSE/tracking/driver; adaptadores propio, Andreani, Mercado Envíos |
| Fulfillment | `domains/sales/orders/` | `orders-fulfillment.service.ts`; coordinar con shipping y reservas |
| Ecommerce externo | `domains/integrations/` | `integrations.service.ts`, WooCommerce, Shopify, MercadoLibre, `ecommerce-order-import.service.ts` |
| Notificaciones | `domains/notifications/` | Service + processor + triggers; SMTP, WhatsApp Evolution, SMS, FCM, plantillas, rate limit, bandeja staff |
| Configuración | `modules/settings/`, `core/crypto/` | Settings y cifrado; revisar modelos/DTOs y `settings.service.ts` antes de añadir claves |
| Reportes | `modules/reports/` | Dashboard, ventas, compras, caja, stock, libro IVA y exportaciones; utilidades de fechas |
| Auditoría | `modules/audit/`, `core/audit-context/`, `core/prisma/` | Interceptor, contexto AsyncLocalStorage y middleware Prisma |
| Backups | `modules/backups/` | Jobs, processor, restore, utilidades y guard de mantenimiento |
| Infraestructura | `core/redis/`, `core/outbox/`, `modules/health/` | Redis, outbox cron, health; filtros y pipes en `core/` |

## Frontend

- `src/main.tsx`: React Query (staleTime 2 min, retry 1), router, fuentes y toast.
- `src/App.tsx`: lazy routes, auth bootstrap, motor de sync, tema y guards.
- `src/pages/admin/`: backoffice; `/admin` muestra ReportsPage. `pages/pos/POSPage.tsx`: POS a pantalla completa en `/pos`.
- `src/pages/storefront/`: catálogo, producto, carrito, checkout/resultados, pedidos, perfil, login y tracking. `/store/*` siempre disponible; rutas raíz adicionales según `utils/storefrontDomain.ts`.
- `src/pages/driver/DriverDeliveryPage.tsx`: `/driver/:token`; tracking público `/track/:token`; comprobante `/comprobante/:orderId`.
- `src/features/<área>/`: formularios, drawers, hooks y componentes de negocio. POS concentra carrito, cobro mixto, QR, impresión y redenciones.
- `src/api/`: wrappers tipados; `client.ts` configura credenciales, errores y redirecciones; `queryKeys.ts` organiza claves de caché.
- `src/rbac/`: guards activos importados por App, permisos, navegación y gates; hay helpers/layouts con nombres duplicados en otras carpetas. Seguir imports.
- `src/store/`: auth ERP y tienda separados, carrito, cola offline, tema y sidebar. Carrito POS adicional en `features/pos/store/usePosStore.ts`.
- `src/features/offline/components/AppUpdateBanner.tsx`: detecta nuevas versiones de la PWA y ofrece actualizar limpiando caches descartables; `src/core/cache/applicationCache.ts` no debe borrar la cola offline.
- `src/components/ui/`: componentes reutilizables; `src/styles/tokens.css`, `src/index.css` y CSS Modules definen el aspecto.
- `Drawer` y `Modal` se montan mediante portal en document.body para evitar recortes por contenedores animados. La creación/edición de listas de precios usa un drawer `lg` de 700px, con márgenes para tablet y ancho completo en móvil.
- `src/types/`, `shared/types/index.ts`: contratos; comprobar DTO backend antes de confiar en tipos compartidos, que no cubren todo el sistema.

## Flujos que conviene leer juntos

### Venta / cobro

`POSPage` → `features/pos/hooks/usePosCheckout.ts` → API POS/ventas → servicios POS/ventas → `CheckoutOrchestrator`. El orquestador comprueba idempotencia y turno, resuelve precio/permisos, calcula promociones y redenciones, y coordina stock/orden/finanzas/outbox en transacción. Después revisar efectos fiscales y notificaciones. Pagos posteriores, cotizaciones y cancelaciones tienen métodos propios; no reutilizar parcialmente un flujo sin revisar sus asientos y reservas.

Pruebas guía: `checkout-financial-impact.spec.ts`, `checkout-confirm-quotation.spec.ts`, `pos.service.spec.ts`, `sales.service.spec.ts`, `returns/returns.service.spec.ts`.

### Stock / compras

`InventoryService` registra movimientos y actualiza niveles; ofrece reservar, liberar y consumir. `StockMovementService` traduce recepción, salida de venta y ajuste. Compras directas, recepción parcial y transferencias tienen caminos separados. Revisar componentes de combos antes de deducir stock. Pruebas: `inventory.service.stock.spec.ts`, `inventory.service.adjust.spec.ts`, `purchasing.totals.spec.ts`.

### Offline

`core/db/db.ts` (Dexie `PosOfflineDB`) almacena catálogo + metadatos. `CatalogSyncService` y `useDexieSync` actualizan caché. **Las operaciones pendientes están en `store/offlineQueue.store.ts`**, Zustand persistido con IndexedDB/idb-keyval. `useSyncEngine`, montado una vez en App, reproduce requests con cookies, backoff y conflictos 409. `usePosOffline` consulta catálogo local; backend dispone de sync engine y resolución de conflictos. `utils/driverOfflineQueue.ts` es otro flujo específico de conductor.

### Eventos y trabajos

- Outbox: `core/outbox/outbox.service.ts` procesa hasta 50 PENDING cada 10 s. Stock dispara sync WooCommerce/Shopify; ORDER_CREATED/ORDER_CONFIRMED se reconocen sin dispatch externo adicional. Tipos sin handler quedan PENDING; errores pasan a FAILED. No asumir reintento automático de FAILED.
- BullMQ: `afip_invoices` (5 intentos, backoff exponencial base 30 s), `notifications_queue` (3 intentos, base 5 s); backups tienen su módulo/processor.
- Auditoría Prisma registra ciertos modelos/acciones con escritura fire-and-forget. No equivale a auditoría transaccional garantizada de todas las mutaciones.

## Datos principales

| Schema | Familias de entidades |
|---|---|
| core | Usuarios/roles/permisos, sucursales/depósitos/ubicaciones, auditoría, outbox, integraciones, notificaciones, promociones, pagos intentados, fulfillment, entregas, backups |
| catalog | Productos/variantes/barcodes, atributos, combos, colecciones, lotes, listas e historial de precios, etiquetas |
| inventory | Movimientos, niveles, reservas, transferencias y líneas |
| sales | Clientes, loyalty, gift cards, órdenes/líneas/pagos, discrepancias, direcciones, devoluciones |
| purchasing | Proveedores, órdenes/líneas y recepciones/líneas |
| finance | Facturas, cuentas/transacciones, recibos, cajas/turnos, cuenta corriente, gastos y ajustes |
| settings | SystemSettings |

El schema físico no siempre coincide con el dominio Nest. Relaciones, índices, defaults, tipos numéricos y restricciones se consultan en Prisma; no inferirlos de interfaces UI.
