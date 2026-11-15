# Offline y sincronización móvil

## Principios

El servidor es la autoridad para precios, promociones, stock, caja, permisos y efectos fiscales. Offline significa capturar una intención operativa y procesarla después; no significa aprobar localmente un resultado financiero.

La cola local debe ser durable, transaccional y auditable. Cada operación tiene un UUID generado en el dispositivo que nunca cambia durante reintentos.

## Datos locales

Guardar sólo lo necesario:

- Catálogo POS permitido para la sucursal: producto, variante, SKU, códigos, precio de consulta, imágenes pequeñas y versión.
- Metadatos de sincronización: `catalogVersion`, `lastSyncAt`, `branchId`, `deviceId`.
- Cola de operaciones y resultado del servidor.
- Carrito no confirmado y preferencias de UX.

No guardar contraseñas, refresh tokens fuera del almacenamiento seguro, secretos ARCA, datos completos de tarjeta ni información sensible innecesaria.

## Envelope existente

`POST /api/offline/sync` recibe:

```json
{
  "batchId": "uuid-del-lote",
  "deviceId": "id-del-dispositivo",
  "branchId": "id-de-sucursal",
  "sentAt": "2026-11-08T12:00:00.000Z",
  "operations": [
    {
      "clientGeneratedId": "uuid-de-operacion",
      "branchId": "id-de-sucursal",
      "userId": "id-del-cajero",
      "type": "CHECKOUT",
      "payload": {},
      "clientTimestamp": "2026-11-08T11:59:00.000Z",
      "status": "PENDING"
    }
  ]
}
```

Tipos definidos por backend: `CHECKOUT`, `RETURN`, `CASH_MOVEMENT`, `STOCK_COUNT`. El servidor ordena por timestamp, verifica duplicados por `clientGeneratedId` y responde `APPLIED`, `CONFLICT` o `REJECTED` por operación.

La app debe tratar `status` local como una proyección de la respuesta del servidor. No enviar una operación ya aplicada salvo para consultar/reconciliar; el backend debe devolver el mismo resultado para un duplicado.

## Máquina de estados local

```text
DRAFT → PENDING → SYNCING → APPLIED
                         ├→ CONFLICT → RESOLVED/RETRY
                         └→ REJECTED → CORRECTION/ABANDONED
```

Las operaciones se reintentan en orden cronológico. Una falla transitoria pausa el drenaje para no sobrecargar el servidor. Una falla permanente queda visible con motivo y acción manual. Un conflicto no se oculta ni se reintenta ciegamente.

## Reintentos

- Red/5xx/503/429: backoff exponencial con jitter, máximo configurable y pausa entre operaciones.
- 401: intentar refresh una sola vez; si falla, bloquear sync y pedir login.
- 403/400/404/422: no reintentar automáticamente; mostrar corrección requerida.
- 409: conservar detalle, valor servidor y valor local; detener operaciones dependientes.
- Timeout: tratar como resultado desconocido y reconsultar por idempotencia antes de crear otra mutación.

## Conflictos

- Checkout con stock insuficiente: el motor actual aplica `CLIENT_WINS` y marca `CONFLICT`; la UI debe informar al encargado.
- Stock count divergente: el motor actual usa `MANAGER_REVIEW`; no sobrescribir silenciosamente el stock.
- Devoluciones, caja y reservas: definir estrategia por operación antes de habilitar offline; si no existe una estrategia segura, exigir conexión.

## Catálogo

Usar `GET /api/pos/sync/catalog?branchId=<id>&since=<cursor>` con cursor/versionado. Verificar checksum o versión, aplicar migración local y conservar la versión anterior hasta completar la nueva. La app debe mostrar antigüedad del catálogo y permitir actualización manual.

## Seguridad de la cola

La cola puede contener precios, clientes y comprobantes. Cifrar la base local cuando la plataforma y el driver lo permitan, bloquear captura de pantalla en vistas sensibles según política, borrar datos al cerrar sesión o revocar dispositivo, y no incluir payloads completos en logs/crash reports.
