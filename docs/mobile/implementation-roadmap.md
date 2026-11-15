# Hoja de ruta de implementación móvil

## Fase 0 — Decisiones y contrato

Entregables:

- Confirmar si la primera app es interna ERP/POS, driver o storefront; esta documentación asume interna.
- Aprobar React Native + Expo + TypeScript y la matriz de plataformas/versiones.
- Definir API móvil versionada, sesión con refresh rotativo, dispositivos y OpenAPI.
- Elegir base local, cifrado, proveedor de crash reporting y push.
- Definir permisos de ubicación, cámara, fotos y notificaciones con legal/producto.

Salida: contrato firmado, backlog priorizado y ambientes de desarrollo/staging.

## Fase 1 — Fundación

Entregables:

- Shell de navegación, tema, accesibilidad, manejo de errores y telemetry.
- Login, MFA, refresh, logout, revocación y bootstrap de `/me`.
- Registro de dispositivo, versión mínima y configuración remota de flags.
- Cliente API generado desde OpenAPI con tests de serialización.

Salida: un usuario puede entrar y ver sólo las capacidades permitidas.

## Fase 2 — Catálogo y venta online

Entregables:

- Sincronización incremental de catálogo y búsqueda local.
- Escáner, variantes, precios, stock y cliente.
- Turno, carrito, cálculo backend, checkout, pagos y comprobante.
- Idempotencia, reconsulta tras timeout y estados de factura asíncrona.

Salida: venta online demostrable en staging con permisos de cajero.

## Fase 3 — Offline controlado

Entregables:

- Cola SQLite transaccional, estados, reintentos y pantalla de actividad.
- Integración con `POST /api/offline/sync` para `CHECKOUT`.
- Tests de duplicado, reconexión, batch parcial, 401, 409 y conflicto de stock.
- Política operativa: qué acciones se bloquean sin conexión.

Salida: venta offline segura en piloto con un número limitado de dispositivos.

## Fase 4 — Inventario, pedidos y entregas

Entregables:

- Consulta/escaneo de inventario y conteo con revisión de conflictos.
- Pedidos, picking/packing y estados de despacho.
- Driver: ubicación, llegada, foto y confirmación de entrega.
- Push y deep links revalidados contra backend.

Salida: piloto operativo de sucursal, depósito y reparto.

## Fase 5 — Endurecimiento y publicación

Entregables:

- Pruebas de seguridad, accesibilidad, rendimiento y recuperación.
- Builds firmadas, distribución interna y monitoreo.
- Migraciones locales, compatibilidad API y rollback.
- Manual de soporte para sesión, sync, conflictos y pérdida de dispositivo.

Salida: release gradual en stores con criterios de rollback cumplidos.

## Dependencias bloqueantes

- No comenzar checkout móvil productivo sin contrato de autenticación nativa.
- No habilitar offline para una operación sin estrategia de conflicto e idempotencia definida.
- No registrar push hasta disponer de revocación de dispositivo y limpieza de tokens inválidos.
- No publicar sin staging aislado, observabilidad y procedimiento de rollback.
