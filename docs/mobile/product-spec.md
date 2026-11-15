# Especificación de producto móvil

## Objetivo

Dar al equipo de Vestix una herramienta móvil segura para ejecutar tareas operativas fuera del escritorio: venta asistida, consulta/ajuste de inventario, preparación y entrega de pedidos, y supervisión básica.

## Usuarios y permisos

La app debe recibir `role`, `permissions`, `branchId` y estado de MFA desde `/api/auth/me`. La navegación es una ayuda de UX; la autorización real continúa en los guards del backend.

| Perfil | Capacidades iniciales |
|---|---|
| Cajero | Iniciar/cerrar turno, buscar/escanear variantes, carrito, cobro, comprobante. |
| Vendedor | Catálogo, precio, stock por depósito, cliente y venta asistida. |
| Depósito | Búsqueda por SKU/código de barras, conteo, movimientos y transferencias según permiso. |
| Repartidor | Pedidos asignados, ubicación, llegada, foto y entrega. Preferir token de conductor restringido si no requiere sesión ERP completa. |
| Encargado | Todas las operaciones de su alcance, autorizaciones de supervisor y resolución de conflictos. |
| Administrador | Configuración, usuarios, reportes e integraciones; no es el foco del MVP móvil. |

## MVP recomendado

1. Login, MFA, cierre de sesión, sesión expirada y selección/confirmación de sucursal.
2. Inicio con estado de conectividad, turno, cantidad de operaciones pendientes y accesos por permiso.
3. Catálogo con búsqueda, escaneo de código de barras, precio vigente, variantes, imágenes y stock por depósito.
4. Venta asistida/POS: carrito, cálculo server-side, cliente, descuentos autorizados, medios de pago, QR Mercado Pago cuando esté configurado, confirmación idempotente y comprobante.
5. Inventario: consulta, conteo y registro de ajuste sólo cuando el permiso y el endpoint estén disponibles.
6. Pedidos y reparto: lista de entregas, detalle, cambio de estado, ubicación y evidencia fotográfica.
7. Bandeja de sincronización: pendientes, fallas, conflictos, reintento manual y detalle de operación.

## Fuera del MVP

Administración completa de usuarios/roles, configuración ARCA, backups/restores, integraciones ecommerce, reportes complejos, compras completas, edición masiva de catálogo y funciones de storefront. Pueden exponerse como enlaces al backoffice web hasta que tengan una necesidad móvil demostrada.

## Navegación

La navegación debe ser por capacidad y no por rol fijo:

`Inicio → Venta | Catálogo | Inventario | Pedidos | Entregas | Actividad | Configuración`

Cada destino se muestra sólo si el usuario tiene el permiso correspondiente; si un deep link llega sin permiso, mostrar estado 403 y volver a Inicio. El rol no debe hardcodearse como única regla.

## Estados obligatorios de UX

- Online, offline y conexión inestable.
- Sesión válida, sesión expirada, MFA pendiente y usuario desactivado.
- Turno cerrado, turno abierto por otro usuario y turno propio.
- Operación pendiente, sincronizando, aplicada, rechazada y conflicto.
- Stock insuficiente o cambiado mientras el dispositivo estuvo offline.
- Error de validación, falta de permiso, mantenimiento 503 y rate limit 429.

## Reglas de negocio que la app debe respetar

- Las líneas operan sobre variantes; no sobre el producto abstracto.
- El checkout recalcula precios, promociones, redenciones y total en el servidor.
- Las ventas POS requieren turno abierto; el modo `STRICT` puede restringirlas al usuario que abrió el turno.
- Al reintentar una venta se conserva el mismo ID generado por el cliente.
- Cotizaciones, reservas, cobros, despachos y cancelaciones tienen efectos distintos; la app no debe simular transiciones con cambios de estado genéricos.
- ARCA/AFIP y notificaciones pueden ser asíncronas; mostrar estado pendiente sin prometer emisión inmediata.

## Criterios de aceptación del MVP

- Un usuario con permiso puede iniciar sesión y completar MFA sin que un token quede en almacenamiento no seguro.
- Una venta online y una venta reintentada producen como máximo una venta con el mismo ID de cliente.
- Una venta sin conectividad queda visible, no se duplica al reconectar y muestra el resultado del servidor.
- Un conflicto de stock se presenta al usuario adecuado con la estrategia aplicada por backend.
- Un usuario sin permiso no puede ejecutar la operación aunque invoque el endpoint manualmente.
- La app funciona con lector de cámara, teclado físico o ingreso manual del código.
- Las acciones destructivas requieren confirmación y, cuando corresponda, autorización de supervisor.
