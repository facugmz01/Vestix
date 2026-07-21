# Prompt maestro — Rebuild funcional de ERP + POS retail indumentaria (Argentina)

> **Uso:** pegá este documento completo (o por fases) en un agente / equipo de desarrollo como especificación de producto.
> **Objetivo:** construir un sistema **nuevo desde cero** con **paridad funcional** respecto al ERP/POS retail descrito aquí.
> **Restricción crítica:** NO copiar arquitectura, código, nombres de archivos, ORM, framework ni estructura del sistema de referencia. Solo mantener **capacidades de negocio y reglas**. El stack, diseño de APIs, modelo de datos y UI deben reinventarse por completo.

---

## 0. Instrucciones para el implementador

Construí un **ERP + POS + tienda online** para un negocio de indumentaria en Argentina (multi-sucursal).

1. Implementá **todas** las funcionalidades listadas en este documento (paridad de producto).
2. Cambiá **por completo** el código, stack, patrones y UX visual (nueva marca, nueva UI).
3. Priorizá correctness de reglas de negocio sobre “features parciales”.
4. Entregá por fases (sección 12), pero el diseño debe contemplar el alcance total desde el día 1.
5. No menciones ni dependas del codebase de referencia; este prompt es la fuente de verdad funcional.

---

## 1. Visión del producto

Sistema único que cubre:

| Superficie | Quién la usa | Propósito |
|---|---|---|
| **Backoffice admin** | Dueños, gerentes, depósito, ecommerce | Catálogo, stock, compras, finanzas, reportes, configuración |
| **POS (caja)** | Cajeros / vendedores en local | Venta rápida, turnos de caja, offline, tickets |
| **Storefront público** | Clientes finales | Catálogo, carrito, checkout, pedidos, perfil |
| **Tracking público** | Cliente | Seguimiento de envío en vivo |
| **App conductor** | Cadetes / drivers | Entrega con GPS, foto, OTP |
| **Wizard de setup** | Primer arranque | Crear admin + datos de empresa |

Mercado: retail de ropa/calzado/accesorios en Argentina, con facturación electrónica AFIP/ARCA, MercadoPago, WhatsApp, y sincronización opcional con marketplaces (WooCommerce, Mercado Libre, Shopify).

---

## 2. Principios de negocio no negociables

1. **Se vende por variante**, nunca por producto base. Toda operación física (stock, compra, venta, conteo, etiqueta) es a nivel SKU/variante (talle + color + atributos).
2. **SKU globalmente único**. Un SKU puede tener **múltiples códigos de barras**.
3. **El servidor es la fuente de verdad de precios**. El cliente envía variante + cantidad (+ descuento manual autorizado). El backend calcula precio final, promociones e impuestos.
4. **Inventario append-only**: no sobrescribir cantidades. Todo cambio es un movimiento tipado (entrada/salida). El stock disponible es el resultado del ledger (+ reservas).
5. **Cantidades de movimiento siempre positivas**; el sentido lo da origen → destino (o tipo: merma, venta, recepción, etc.).
6. **Costo promedio ponderado (WAC)** al recibir mercadería; el costo de salida de venta se congela en el movimiento para COGS.
7. **Idempotencia en ventas**: el cliente genera UUID de orden; reintentos no duplican cobro ni stock.
8. **Sucursal ≠ depósito**: el stock físico vive en warehouses; una sucursal suma sus warehouses.
9. **Facturación AFIP desacoplada de la venta**: la venta operativa puede cerrarse sin CAE; la factura electrónica se emite sync/async/cola.
10. **Crédito de cliente**: rechazo duro si `usedCredit + total > creditLimit`.
11. **Tesorería explícita**: todo cobro/pago se rutea a una cuenta financiera (caja, banco, MP, etc.).
12. **Snapshots históricos**: líneas de pedido guardan nombre, SKU y precio al momento de la venta (el catálogo puede cambiar después).

---

## 3. Roles y permisos (RBAC)

Acciones: `create | read | update | delete | manage | print`.
Sujetos mínimos: `Catalog, Inventory, Purchasing, Sales, Customers, Suppliers, Finance, Reports, Settings, Sync, Users, Labels, Delivery, Branch, System, Pricing, Integrations, Backups, all`.

Roles semilla:

| Rol | Alcance típico |
|---|---|
| Super Admin | `manage/all` |
| Store Manager | Operación amplia de sucursal (ventas, clientes, usuarios locales, settings/branch, labels, delivery; lectura finance/reports/catalog/inventory) |
| Cashier | Crear ventas/clientes, abrir/cerrar turno, leer catálogo/sync/labels/finance, imprimir etiquetas |
| Warehouse Operator | Inventario + compras (read/update), labels, delivery |
| Ecommerce Manager | Catálogo, inventario, ventas online, clientes, reports, delivery |
| Delivery Driver | Solo delivery read/update |
| Viewer | Lectura catalog/inventory/reports |

Auth staff: login email/password, sesión segura (cookie httpOnly o equivalente), logout, “me”.
Auth storefront: **OTP** por email o WhatsApp/SMS según configuración (separado del staff).

---

## 4. Módulos funcionales (paridad requerida)

### 4.1 Setup / onboarding
- Detectar si el sistema está inicializado.
- Paso 1: crear Super Admin.
- Paso 2: datos de empresa (nombre, CUIT, domicilio, teléfono, email) → crear sucursal central, depósito principal, caja, métodos de pago por defecto (efectivo/débito/crédito/transferencia/MercadoPago), cuentas de tesorería, settings generales y nombre de tienda.

### 4.2 Identidad y organización
- Usuarios CRUD, activar/desactivar, asignar sucursales y roles.
- Roles CRUD con matriz de permisos.
- Sucursales CRUD + configuración.
- Cajas registradoras CRUD.
- Warehouses CRUD.
- Ubicaciones internas (pasillo/rack/bin) CRUD.

### 4.3 Catálogo
- Categorías, marcas, atributos y valores de atributo.
- Productos: tipos **SIMPLE / VARIABLE / COMBO**.
- Variantes: SKU, barcodes, atributos (talle/color/etc.), precios, costo, dimensiones, imágenes, activo/publicado.
- Combos: receta de componentes; al vender, descontar stock de componentes.
- Colecciones / temporadas / campañas.
- Generación de SKU y barcodes.
- Importación masiva (CSV/Excel), validación previa, actualización masiva de precios.
- Duplicar producto, publicar en lote, limpiar catálogo (admin), historial de precios.
- Consulta rápida de precios (búsqueda por barcode/SKU/nombre + stock) sin abrir POS.
- Escáner QR admin (gift cards, deep-links a POS/órdenes/productos).

### 4.4 Precios y promociones
- Listas de precios (absolutas o modificadores %); asignación a clientes; lista default configurable.
- Motor de promociones: BOGO / 2x1, descuento por categoría, descuento por total de carrito, % global (alcance ALL/CATEGORY).
- Detección de conflictos, preview de impacto, bulk update.
- Descuentos manuales en POS con tope configurable / autorización.

### 4.5 Etiquetas
- Plantillas de etiquetas (CRUD, duplicar, default).
- Editor visual de plantillas.
- Impresión por variante / lote: preview, PDF, ZPL (impresoras térmicas/Zebra).
- Impresión desde recepción de mercadería y desde variantes.

### 4.6 Inventario / logística
- Consulta de stock por sucursal/warehouse/variante (disponible vs reservado).
- Ajustes y conteos físicos (auditoría masiva).
- Kardex / ledger de movimientos.
- Tipos de movimiento: recepción, venta, devolución, transferencia in/out, merma, corrección POS, reserva / liberación.
- Transferencias entre warehouses: DRAFT → IN_TRANSIT → RECEIVED/CANCELLED (validar stock al despachar; recepción parcial/discrepancias).
- Reservas de stock (crear/consumir/liberar) + expiración automática (TTL ~15 min para holds de carrito/ecommerce).
- Reglas de reposición (punto de reorden → sugerir/crear borrador de OC).

### 4.7 Compras / proveedores
- Proveedores CRUD + importación de saldos.
- Órdenes de compra: borrador → emitir → recibir; editar/eliminar borradores; pagos contra OC.
- Compra directa (entrada + pago/deuda en un flujo).
- Remitos / goods receipts: borrador → validar → actualiza stock + WAC.
- Auto-replenish desde stock bajo.

### 4.8 Ventas / POS
- Checkout de venta con UUID cliente, multi-pago, cliente opcional.
- Cotizaciones / presupuestos (sin stock/cobro/AFIP hasta confirmar).
- Confirmación de pago, cancelación, estados de orden.
- Ticket/comprobante público por link; envío de ticket (email/WhatsApp).
- Importación masiva de ventas históricas (si aplica).
- **POS:**
  - Apertura de turno de caja (float inicial); cierre con conteo ciego; diferencia → ajuste de tesorería + alerta.
  - Modo estricto opcional: solo el que abrió puede operar/cerrar.
  - Catálogo grid + búsqueda + scanner de barcode.
  - Carrito: cantidades, descuento línea/%, descuento carrito, favoritos (atajos), recientes, duplicar última venta, suspender/reanudar.
  - Métodos de pago: efectivo (vuelto), tarjeta, transferencia, crédito de cliente, mixto, QR MercadoPago (online), gift card, puntos loyalty.
  - Factura AFIP opcional al cobrar.
  - Impresión de ticket térmico / PDF según settings.
  - Indicador de sync / cola offline; forzar sync.
  - Atajos de teclado (buscar, cobro rápido, favoritos, etc.).

### 4.9 Offline (POS y flujos críticos)
- Catálogo local (réplica acotada: stock de la sucursal + top sellers; no necesariamente catálogo global completo).
- Cola append-only de comandos: checkout, return, movimiento de caja, conteo de stock.
- Idempotencia por `clientGeneratedId`.
- Conflictos de stock: aplicar venta + marcar corrección/auditoría (CLIENT_WINS con traza), no silenciar.
- Conteos con discrepancia: marcar CONFLICT para revisión de gerente (no auto-aplicar ciegamente).
- Banner de estado offline visible; panel de sync en admin.

### 4.10 Devoluciones
- Alta PENDING → approve/reject.
- Al aprobar: reingreso a stock si sellable; reembolso en efectivo (tesorería) o crédito en cuenta corriente; nota de crédito AFIP encolable.

### 4.11 Clientes / CRM
- CRUD clientes (DNI/CUIT, contacto, límites de crédito, lista de precios).
- Historial de compras.
- Importación de saldos de cuenta corriente.
- Canales de origen (POS / storefront / import / admin).

### 4.12 Loyalty
- Config: puntos por monto, valor de canje.
- Alta/consulta de cuenta; earn en venta completada; redeem en checkout; ajustes manuales; tiers.

### 4.13 Gift cards
- Emisión (fondeo desde tesorería), saldo, canje, desactivar.
- Código único + token de verificación pública.
- Plantilla visual imprimible/digital.
- Verificación por QR/escáner.

### 4.14 Finanzas
- Cuentas corrientes clientes y proveedores: movimientos, recibos, NC/ND, estados de cuenta, blast de morosos.
- Tesorería: cuentas + transacciones.
- Métodos de pago configurables.
- Turnos de caja (ver POS) + auditoría de sesiones.
- Listado de pagos.
- Facturas: emitir / reintentar / cancelar / nota de débito.
- AFIP/ARCA: CSR, carga de certificados, test de conexión, cola de fallidos + retry.
- Tipos de comprobante A/B/C, multi-IVA (21 / 10.5 / 27 / 0), NC y ND.
- Libro IVA ventas y compras (reporte fiscal).

### 4.15 Storefront (ecommerce propio)
- Catálogo público con filtros (categoría/marca), orden, detalle con variantes y stock.
- Carrito local + checkout en pasos: datos comprador (+ factura opcional) → envío (domicilio / retiro) → pago.
- MercadoPago Checkout Preferencias / redirect; páginas success/failure/pending.
- Login OTP; perfil; mis pedidos con timeline y mapa en vivo si está en tránsito.
- Branding: colores, tipografías, header, redes, ocultar sin stock, métodos de pago/envío, PWA install branding.
- Manifest / installabilidad de tienda.

### 4.16 Delivery / fulfillment / shipping
- Pipeline: pagado → pick → pack → despacho → en tránsito → arribo → completado.
- Transportistas: flota propia, Andreani, Mercado Envíos (credenciales/toggles).
- Links: tracking público + app conductor (token).
- Conductor: GPS en vivo, cola offline de GPS, marcar llegada, foto opcional, completar con OTP 6 dígitos.
- Tracking público: timeline + mapa (SSE o equivalente).
- Confirmación de entrega por cliente.
- Geocoding de direcciones.

### 4.17 Notificaciones
- Plantillas multi-canal: Email, WhatsApp, SMS, Push.
- Eventos: venta/ticket, envío, OTP delivery, stock bajo, discrepancia de turno, estados de cuenta, etc.
- Logs, cola, retry, preview, variables, test send.
- WhatsApp vía Evolution API (QR/connect/status/webhook).
- Inbox de notificaciones internas para staff.

### 4.18 Integraciones externas
Panel para configurar/toggle/test/sync + logs de webhooks + retry:

| Integración | Capacidades |
|---|---|
| MercadoPago | Preferencias storefront, QR POS, webhooks firmados, confirmación de pago |
| AFIP/ARCA | WSFE real: último comprobante, crear voucher, CAE; multi-IVA; FA/NC/ND en cola |
| WooCommerce | Sync stock/precio/estado; webhook de órdenes entrantes; mapeo de variantes |
| Mercado Libre | Sync stock; webhook órdenes; mapeos |
| Shopify | Sync inventario mapeado; webhook órdenes; mapeos |
| WhatsApp (Evolution) | Conexión y envíos |
| SMTP / SMS / FCM | Canales de notificación |
| Andreani / Mercado Envíos | Creación de envíos / tracking |

Outbound de stock: tras movimientos, publicar cambios a canales mapeados (outbox / worker).

### 4.19 Reportes
- Dashboard KPIs: ventas hoy, compras hoy, deuda proveedores, saldo cajas, pedidos/compras del mes, egresos, stock bajo, pedidos pendientes.
- Ventas (resumen, top sellers, COGS).
- Stock (valuación, low stock).
- Compras.
- Caja.
- Libro IVA ventas/compras.
- Export CSV/Excel (async si el volumen es grande).

### 4.20 Auditoría, sync, backups, settings, health
- Audit log inmutable (quién/qué/cuándo/antes-después) + traza por entidad.
- Estado de sync offline (cola, conflictos, reintentos).
- Backups: crear (`pg_dump` o equivalente), listar, descargar, restaurar, borrar (jobs en cola).
- Settings centralizados (JSON o tablas) por secciones: comercio, POS, tickets, fiscal/ARCA, labels, gift cards, storefront, QR cobro, notificaciones, integraciones, PWA, offline TTL/estrategia, loyalty, carriers, etc.
- Health check de liveness.
- Tests de SMTP/SMS/WhatsApp/push/AFIP desde settings.

---

## 5. Reglas de flujos clave (detalle)

### 5.1 Checkout
1. Validar idempotency key / UUID.
2. Resolver precios (lista del cliente > default > base) + promociones + descuentos autorizados.
3. Exigir turno de caja abierto si canal POS/OFFLINE.
4. Reservar/consumir stock (combos → componentes).
5. Aplicar gift card / loyalty si corresponde.
6. Registrar pagos → tesorería; crédito cliente con límite.
7. Persistir orden + líneas snapshot.
8. Encolar AFIP y notificaciones post-commit.
9. Acumular puntos loyalty.

### 5.2 Recepción de compra
1. Validar remito vs OC (si hay).
2. Movimientos GOODS_RECEIPT.
3. Recalcular WAC por variante.
4. Actualizar estado OC / saldos proveedor.
5. Opcional: imprimir etiquetas.

### 5.3 Cierre de turno (Z)
- Esperado = apertura + neto de movimientos de efectivo del turno.
- Conteo ciego del cajero → diferencia → asiento de ajuste + notificación si ≠ 0.

### 5.4 Offline sync
- Solo comandos inmutables hacia el servidor.
- Catálogo es read-only en el POS.
- Si stock servidor = 0 y llega venta offline: crear movimiento de corrección auditable y luego la venta (evitar negativos “silenciosos”).

---

## 6. Pantallas / UX mínimas a cubrir

**Admin:** dashboard/reportes, catálogo (+ editor + variantes), atributos/categorías/marcas, colecciones, listas de precios, promociones, consulta precios, escáner, etiquetas + editor plantillas, inventario + movimientos + transferencias + reservas, warehouses/locations, compras + nueva compra + remitos, proveedores, ventas, devoluciones, loyalty, gift cards (+ template), delivery + carriers, clientes, CC / tesorería / pagos / facturas, usuarios, roles, sucursales, cajas, settings, notificaciones, integraciones, backups, auditoría, sync.

**POS:** pantalla fullscreen de venta + turnos + offline + impresión.

**Público:** setup, login staff, storefront completo, tracking, driver, comprobante público, forbidden.

Diseño: **nueva identidad visual** (no clonar la UI de referencia). Mobile-friendly en storefront, POS y driver.

---

## 7. Requisitos no funcionales

- Multi-sucursal, multi-warehouse.
- API REST (u otro estilo coherente) versionable; webhooks inbound responden rápido y procesan async.
- Colas para AFIP, notificaciones y backups.
- Outbox transaccional para side-effects (stock → marketplaces, etc.).
- Auditoría en mutaciones críticas.
- Seguridad: RBAC en cada endpoint sensible; cookies/JWT seguros; rate-limit en setup y OTP.
- Observabilidad básica: health, logs de integración, reintentos.
- Tests automatizados de reglas críticas: WAC, idempotencia, reservas, checkout, turnos, AFIP voucher mapping, devoluciones, combos.
- Deployable en Linux con PostgreSQL + Redis (o equivalentes justificados).
- Documentación de arranque: setup wizard, variables de entorno, cómo correr admin/POS/storefront.

---

## 8. Modelo de datos conceptual (reinventar implementación)

Entidades mínimas (nombres libres):

User, Role, Permission, Branch, Warehouse, Location,  
Category, Brand, Attribute, AttributeValue, Product, Variant, Barcode, ComboLine, Collection,  
PriceList, PriceListEntry, PriceHistory, PromotionRule, LabelTemplate,  
Customer, LoyaltyAccount, GiftCard,  
SaleOrder, OrderLine, OrderPayment, SaleReturn, ReturnLine, ShippingAddress,  
InventoryMovement, StockLevel, StockReservation, StockTransfer(+lines), CartHold,  
Supplier, PurchaseOrder(+lines), GoodsReceipt(+lines),  
Invoice, FinancialAccount, FinancialTransaction, CashRegister, PaymentMethod, CashShift, CurrentAccountMovement,  
SystemSettings, NotificationTemplate, NotificationLog, StaffNotification,  
OutboxEvent, AuditLog, OfflineSyncLog, BackupJob, IntegrationLog,  
Variant mappings (WC/ML/Shopify), PaymentIntent, OrderFulfillment, Delivery, DeliveryValidation.

---

## 9. Integraciones — contratos de comportamiento

- **AFIP caída:** venta OK; factura en cola; ticket proforma; envío de PDF legal cuando haya CAE.
- **MercadoPago:** webhook → marcar orden pagada de forma idempotente.
- **Marketplaces:** mapeo variante ERP ↔ variante externa; sync stock; import órdenes.
- **WhatsApp:** plantillas renderizadas; no bloquear checkout si el canal falla (log + retry).

---

## 10. Fuera de alcance explícito (no inventar de más)

No hace falta (salvo que se pida después): contabilidad general completa (asientos contables), multi-tenant SaaS, app nativa iOS/Android aparte del PWA, BI avanzado, motor de promociones tipo “rules engine enterprise” más allá de los tipos listados, ni ERP de manufactura.

---

## 11. Criterio de aceptación (Definition of Done)

El sistema se considera en paridad cuando:

1. Un negocio puede: setup → cargar catálogo con variantes → recibir stock → vender en POS (online y offline) → cerrar turno → emitir factura AFIP → devolver → transferir entre depósitos → comprar a proveedor.
2. Un cliente puede: comprar en storefront con MP → trackear envío → confirmar entrega.
3. Un conductor puede completar una entrega con OTP/GPS.
4. Gift cards, loyalty, promociones y listas de precios afectan el checkout correctamente.
5. Reportes de ventas/stock/caja/Libro IVA exportan datos coherentes con el ledger.
6. Integraciones WC/ML/Shopify/MP/WhatsApp/AFIP están configurables y operativas al menos en modo test/homologación.
7. RBAC impide a un cajero administrar settings/usuarios.
8. No existe dependencia de código del sistema de referencia.

---

## 12. Plan de entrega sugerido (por fases)

**Fase A — Fundación:** auth/RBAC, setup, sucursales/warehouses, catálogo+variantes, inventario ledger+WAC, POS online efectivo, turnos de caja.  
**Fase B — Retail + fiscal:** multi-pago, CC, devoluciones, AFIP cola, reportes base, etiquetas.  
**Fase C — Omnicanal:** storefront+MP, reservas, delivery+tracking+driver, notificaciones WhatsApp/email.  
**Fase D — Avanzado:** offline POS robusto, promociones/listas, loyalty/gift cards, combos, compras/OC/remitos, transferencias, marketplaces, backups, auditoría, Libro IVA.

---

## 13. Prompt corto (versión condensada para pegar)

```text
Construí desde cero un ERP + POS + storefront para retail de indumentaria en Argentina.
Paridad funcional con: multi-sucursal/depósito; catálogo con variantes/combos/colecciones;
listas de precios y promociones; etiquetas ZPL/PDF; inventario append-only con WAC,
transferencias, reservas y conteos; compras/OC/remitos/proveedores; POS con turnos de caja,
multi-pago, crédito cliente, gift cards, loyalty, cotizaciones e impresión de tickets;
offline POS con cola idempotente; devoluciones; cuenta corriente y tesorería; facturación
electrónica AFIP/ARCA (A/B/C, multi-IVA, NC/ND, Libro IVA) en cola; storefront con OTP,
MercadoPago y mis pedidos; fulfillment con flota propia/Andreani/Mercado Envíos, tracking
público y app conductor (GPS+OTP); notificaciones Email/WhatsApp/SMS/Push; integraciones
WooCommerce, Mercado Libre, Shopify; reportes/dashboard; auditoría; backups; wizard de setup;
RBAC con roles Super Admin, Manager, Cajero, Depósito, Ecommerce, Driver, Viewer.

Reglas duras: vender solo variantes; servidor autoridad de precios; stock por movimientos
positivos tipados; UUID cliente idempotente; AFIP desacoplado de la venta; crédito con límite;
tesorería explícita; snapshots en líneas de venta.

IMPORTANTE: reinventá stack, arquitectura, APIs, esquema y UI por completo. No copies código
ni estructura de ningún sistema existente. Entregá por fases A→D manteniendo el diseño total.
```

---

## 14. Cómo usar este documento

1. **Rebuild completo:** pegá secciones 0–11 a un agente con contexto largo.
2. **Kickoff rápido:** usá solo la sección 13 y adjuntá este archivo como referencia.
3. **Por sprint:** usá los prompts de la sección 15 (uno por fase, en orden A→D).
4. **QA:** usá la sección 11 como checklist de aceptación.

---

## 15. Prompts listos para pegar (por fase)

Usá un **Agent / chat nuevo** por fase en el **repo nuevo**. Adjuntá siempre `SPEC.md` (este archivo). No abras el repo Vestix como contexto.

### Prefijo común (opcional, si el agente “olvida”)

```text
Fuente de verdad: SPEC.md.
Paridad funcional del SPEC; stack/código/UI 100% nuevos (nada de Nest/Vite/Prisma ni estructura Vestix).
No implementes alcance de fases posteriores. Si algo es ambiguo, elegí lo más simple que cumpla la regla de negocio.
Al final: README de cómo correr, tests de reglas críticas, y checklist de aceptación de ESTA fase.
```

---

### Prompt — Fase A (Fundación)

```text
Leé SPEC.md. Implementá SOLO la Fase A — Fundación.

Alcance OBLIGATORIO:
1. Wizard de setup: detectar si está inicializado; crear Super Admin; datos de empresa → sucursal central, depósito, caja, métodos de pago default (al menos efectivo), cuenta de tesorería caja, settings básicos.
2. Auth staff: login email/password, sesión segura, logout, /me.
3. RBAC: acciones create/read/update/delete/manage (+ print preparado); sujetos mínimos Catalog, Inventory, Sales, Customers, Finance, Reports, Settings, Users, Branch, Sync; roles semilla Super Admin, Store Manager, Cashier, Warehouse Operator, Viewer.
4. Organización: sucursales, warehouses, cajas registradoras (CRUD básico).
5. Catálogo: categorías, marcas, atributos/valores; productos SIMPLE y VARIABLE; variantes con SKU único, barcodes, precio base, costo, activo; CRUD admin usable.
6. Inventario: ledger append-only (movimientos con cantidad positiva tipada); stock disponible por warehouse/variante; ajuste/entrada manual de stock; WAC al ingresar mercadería.
7. Clientes CRUD básico (sin crédito aún, o creditLimit=0).
8. POS online (sin offline): abrir turno (float), vender solo variantes, barcode/búsqueda, carrito, cobro SOLO efectivo (vuelto), UUID de orden idempotente, snapshot nombre/SKU/precio en líneas, descontar stock vía movimiento SALE, imprimir ticket simple (browser print OK).
9. Cierre de turno con conteo ciego: esperado = apertura + neto efectivo del turno; registrar diferencia.
10. Health check + README run local (DB + API + admin/POS).

Reglas duras a respetar ya:
- No vender producto base, solo variantes.
- Servidor autoridad de precio (cliente manda variantId + qty).
- Stock solo por movimientos; no UPDATE ciego de cantidad.
- Idempotencia por UUID de orden.
- Tesorería: cobro efectivo ruteado a cuenta caja.

FUERA DE ALCANCE (no implementar): AFIP, MercadoPago, storefront, offline, devoluciones, compras/OC, transferencias, promociones, gift cards, loyalty, delivery, marketplaces, WhatsApp, backups, Libro IVA, multi-pago, crédito cliente.

Antes de codear: proponé stack + estructura de carpetas en un mensaje y esperá OK.
Después implementá con tests unitarios de: WAC, idempotencia de checkout, RBAC cajero no administra Settings/Users, cierre de turno con diferencia.

Criterio de aceptación Fase A:
Setup → crear producto con variantes → cargar stock → abrir turno → vender en efectivo → ticket → cerrar turno → stock y caja coherentes.
```

---

### Prompt — Fase B (Retail + fiscal)

```text
Leé SPEC.md y el código actual de Fase A. Implementá SOLO la Fase B — Retail + fiscal.
No rompas lo que ya funciona. No empieces Fase C/D.

Alcance OBLIGATORIO:
1. Multi-pago en POS: efectivo, tarjeta, transferencia, mixto; cada cobro ruteado a cuenta de tesorería; métodos de pago configurables.
2. Crédito de cliente / cuenta corriente: creditLimit; rechazo si usedCredit + total > limit; movimientos de CC; recibos básicos.
3. Cotizaciones/presupuestos: sin descontar stock ni cobrar ni facturar hasta confirmar.
4. Devoluciones: PENDING → approve/reject; al aprobar reingreso sellable; reembolso efectivo (tesorería) o crédito en CC.
5. AFIP/ARCA: settings CSR/cert/test; facturación desacoplada (venta OK sin CAE); cola async FA A/B/C; multi-IVA 21/10.5/27/0; reintento de fallidos; NC al devolver (encolable); ticket proforma si no hay CAE.
6. Etiquetas: plantilla default + impresión por variante (PDF y/o ZPL); desde admin y opcional post-recepción si ya hay entrada de stock.
7. Reportes base: dashboard KPIs (ventas hoy, stock bajo, saldo caja); resumen ventas; export CSV de ventas.
8. Settings: datos fiscales/comercio, opciones POS, estilo de ticket.

FUERA DE ALCANCE: storefront, MercadoPago, offline POS, delivery, WhatsApp, WC/ML/Shopify, gift cards, loyalty, promociones avanzadas, combos, OC/proveedores completos, transferencias, Libro IVA, backups.

Tests mínimos: límite de crédito; devolución approve restaura stock; job AFIP no bloquea checkout; multi-pago suma = total.

Criterio de aceptación Fase B:
Venta multi-pago → factura AFIP en cola (o mock homologación) → devolución con NC/crédito → reporte de ventas exportable → etiqueta imprimible.
```

---

### Prompt — Fase C (Omnicanal)

```text
Leé SPEC.md y el código de Fases A+B. Implementá SOLO la Fase C — Omnicanal.
No implementes offline robusto, marketplaces, loyalty/gift cards, ni Libro IVA (eso es Fase D).

Alcance OBLIGATORIO:
1. Storefront público: catálogo, filtros categoría/marca, detalle con variantes/stock, carrito, checkout en pasos (datos → envío domicilio/retiro → pago).
2. Auth clientes storefront por OTP (email y/o WhatsApp/SMS según settings), perfil, mis pedidos.
3. MercadoPago: preferencia/checkout redirect; webhooks firmados; páginas success/failure/pending; marcar orden pagada idempotente.
4. Reservas de stock en checkout ecommerce + TTL (~15 min) + job que libera expiradas; físico se descuenta al despachar/entregar según diseño elegido (documentalo).
5. Fulfillment: pipeline pagado → pick → pack → despacho → tránsito → arribo → completado.
6. Carriers: flota propia + hooks/config para Andreani y Mercado Envíos (aunque Andreani/ME puedan quedar stub configurables).
7. Tracking público por token + mapa/timeline (SSE o polling).
8. App conductor por token: GPS, marcar llegada, foto opcional, completar con OTP 6 dígitos; cola offline de GPS aceptable.
9. Notificaciones: plantillas Email + WhatsApp (Evolution u otro); eventos venta/ticket, envío, OTP delivery; logs + retry; fallo de canal no bloquea checkout.
10. Branding storefront básico (nombre, colores, ocultar sin stock).

FUERA DE ALCANCE: Dexie/offline POS completo, promociones motor, gift cards, loyalty, combos, compras/OC/remitos, transferencias inter-depósito, sync WC/ML/Shopify, backups, auditoría full, Libro IVA.

Tests mínimos: reserva expira y libera; webhook MP idempotente; OTP delivery completa pedido; checkout no falla si WhatsApp cae.

Criterio de aceptación Fase C:
Cliente compra en storefront con MP → pedido aparece en admin → despacho → tracking público → conductor completa con OTP → notificación enviada o encolada.
```

---

### Prompt — Fase D (Avanzado / paridad)

```text
Leé SPEC.md y el código de Fases A+B+C. Implementá la Fase D — Avanzado hasta paridad del SPEC.
Cerrá gaps; no reescribas módulos estables sin necesidad.

Alcance OBLIGATORIO:
1. Offline POS: réplica acotada de catálogo (stock sucursal + top sellers); cola append-only (checkout, return, cash movement, stock count); clientGeneratedId idempotente; indicador de sync; conflictos de stock con corrección auditable (no negativos silenciosos); conteos CONFLICT a revisión.
2. Listas de precios (absolutas/% ) + asignación a clientes; historial de precios.
3. Promociones: BOGO/2x1, descuento categoría, descuento total carrito, % global; servidor aplica en calculate/checkout.
4. Loyalty: config puntos, earn/redeem, ajustes, tiers básicos.
5. Gift cards: emitir, saldo, canje en POS, desactivar, verificación pública/QR, plantilla simple.
6. Combos: receta; venta descuenta componentes.
7. Compras: proveedores, OC draft→issue→receive, compra directa, goods receipts + WAC, auto-replenish por reorder point.
8. Transferencias warehouses: DRAFT→IN_TRANSIT→RECEIVED/CANCELLED; recepción parcial/discrepancias.
9. Colecciones/temporadas; import CSV catálogo/precios; consulta precios admin; escáner QR admin.
10. Marketplaces: WooCommerce, Mercado Libre, Shopify — config/toggle, mapeo variantes, sync stock outbound (outbox), webhooks de órdenes inbound.
11. Libro IVA ventas/compras; ND AFIP; reportes stock valuación/COGS/caja/compras + export.
12. Auditoría inmutable de mutaciones críticas; panel sync offline; backups create/download/restore (cola).
13. Settings restantes del SPEC (PWA branding, offline TTL, carriers, integraciones, labels editor si falta).
14. Roles restantes: Ecommerce Manager, Delivery Driver + matriz de permisos completa.

Verificá reglas duras del SPEC (sección 2) y Definition of Done (sección 11).

Criterio de aceptación Fase D = sección 11 del SPEC completa.
Al terminar: checklist marcado, README de producción/homologación AFIP, y lista de stubs restantes (si algún carrier/marketplace queda mock, documentalo).
```

---

### Prompt puente (entre fases, para QA)

```text
No agregues features nuevas. Revisá la fase que acabamos de cerrar contra su criterio de aceptación en SPEC.md sección 15.
Corregí bugs, agregá tests faltantes, asegurate que el README permite correr todo en local, y listá explícitamente qué queda para la siguiente fase.
```

Fin del prompt.
