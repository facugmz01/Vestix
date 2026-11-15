# Contrato de API para móvil

## Convenciones

- Base: `https://<host>/api`; health: `GET /health`.
- JSON UTF-8; fechas ISO-8601; moneda por defecto ARS y locale `es-AR`.
- `401` sesión inválida/expirada; `403` permiso insuficiente; `409` conflicto/idempotencia; `422` validación; `429` límite; `503` mantenimiento.
- El filtro HTTP normaliza errores con `statusCode`, `message` y, en validación, `errors` por campo. El cliente debe conservar el cuerpo para soporte.
- Todos los endpoints protegidos deben aplicar autenticación y permisos en backend. Ocultar una acción en UI no es seguridad.

## Superficies reutilizables actuales

| Caso | Endpoints principales | Observaciones |
|---|---|---|
| Identidad ERP | `/auth/login`, `/auth/login-mfa`, `/auth/me`, `/auth/logout`, `/auth/profile`, `/auth/change-password`, `/auth/mfa/*` | Usa cookie `erp_token`; adaptar para móvil antes de producción nativa. |
| Catálogo POS | `GET /pos/sync/catalog`, `GET /pos/catalog/search`, `GET /pos/price-check`, `POST /pos/scan` | Requiere `Catalog:read`; sincronización acepta `since` y `branchId`. |
| Venta/POS | `/pos/session/*`, `/pos/cart/calculate`, `/pos/quick-sale`, `/sales/checkout`, `/pos/qr-order/*` | Validar DTO real y mantener ID de idempotencia. |
| Clientes/beneficios | `/customers/*`, `/loyalty/*`, `/gift-cards/*` | Separar consulta de mutaciones y permisos. |
| Inventario | `/inventory/stock*`, `/inventory/movements*`, `/inventory/reservations*`, `/inventory/transfers*` | El stock pertenece al depósito; no inferirlo sólo desde sucursal. |
| Pedidos/entregas | `/sales/orders*`, `/shipping/*`, `/driver/:token/*`, `/track/:token` | Driver token es una superficie diferente a sesión ERP. |
| Offline | `POST /offline/sync`, `GET /offline/logs` | El batch actual requiere permiso `Sync:create`; ver contrato detallado en `offline-sync.md`. |
| Notificaciones | `/notifications/inbox`, `/notifications/inbox/:id/read` | Push móvil requiere registrar dispositivo; el backend tiene capacidades de FCM pero debe definirse el endpoint de registro. |
| Reportes | `/reports/*` | No incluir todos en MVP móvil; usar consultas paginadas o agregadas. |

## Contrato de checkout móvil

La app debe tener dos caminos explícitos:

1. Online: solicitar cálculo a `/pos/cart/calculate`, mostrar resultado, enviar el DTO definitivo a `/sales/checkout` y conservar la respuesta completa.
2. Offline: crear operación `CHECKOUT` con un UUID estable en `clientGeneratedId`, guardar payload y timestamp, y enviar el batch a `/offline/sync` al reconectar.

Nunca generar una venta online y luego una venta offline como fallback para la misma confirmación. La operación debe elegir un camino antes de mutar el estado local.

## Cambios backend necesarios antes del desarrollo nativo

- Agregar autenticación móvil con refresh rotativo y revocación por dispositivo.
- Formalizar DTOs versionados para móvil; no usar `any` ni depender de formas implícitas de respuestas.
- Añadir `Idempotency-Key` opcional/obligatorio para mutaciones críticas y documentar su relación con `clientGeneratedId`.
- Agregar paginación, `since`/cursor y versión de catálogo para evitar descargas completas repetidas.
- Agregar endpoints de dispositivo/push y preferencias de notificación.
- Definir resolución y consulta de conflictos, especialmente para `STOCK_COUNT`, porque el motor actual registra el conflicto pero la resolución manual móvil aún no está especificada.
- Revisar `POST /offline/sync` para que autentique que `userId`, `branchId` y `deviceId` pertenecen a la sesión, en lugar de confiar en valores del payload.
- Definir límites de tamaño, compresión y timeout para batches y fotos.
- Publicar OpenAPI generado desde controladores/DTOs y usarlo para generar el cliente TypeScript móvil.
