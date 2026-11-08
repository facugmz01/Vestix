# Vestix: memoria rápida

Revisado: 2026-11-03. Base: commit `9e93f46e`. Memoria de código, no certificación de funcionamiento en producción.

## Cómo usar esta memoria

Leer este archivo al comenzar; abrir únicamente la sección pertinente de [PROJECT_MAP.md](PROJECT_MAP.md) y luego los archivos fuente afectados. Para ejecución y límites de validación: [PROJECT_OPERATIONS.md](PROJECT_OPERATIONS.md). No cargar todos los documentos históricos ni recorrer dependencias para orientarse.

El código actual, los módulos registrados y `schema.prisma` prevalecen sobre esta memoria cuando divergen. Actualizar estos archivos al cambiar arquitectura, flujos o comandos; no acumular diarios de sesiones ni copiar secretos.

## Producto y arquitectura

- ERP/POS para retail de indumentaria en Argentina; sucursales, depósitos, variantes, compras, tesorería, facturación ARCA, tienda online y entregas.
- Monolito modular NestJS 11 en `backend/`; React 18 + Vite 5 en `frontend/`. Cada aplicación tiene su propio package.json; contratos parciales en `shared/types/index.ts`.
- PostgreSQL mediante Prisma 5.10: **71 modelos** en 7 schemas (`core`, `catalog`, `inventory`, `sales`, `purchasing`, `finance`, `settings`). Fuente: `backend/prisma/schema.prisma`.
- Redis + BullMQ para trabajos; cron Nest para tareas y outbox. No asumir que todos los procesos asíncronos usan una misma cola.
- UI: React Router, TanStack Query, Zustand, Axios, CSS Modules y tokens CSS. PWA y catálogo offline Dexie; cola de operaciones persistida con idb-keyval.
- La PWA usa actualización con confirmación visible: cuando hay un service worker nuevo, `AppUpdateBanner` permite limpiar caches descartables y aplicar la actualización. La acción conserva `erp-offline-queue` para no perder operaciones pendientes.

## Entradas que resuelven la mayoría de las tareas

| Necesidad | Abrir primero |
|---|---|
| Registro real de módulos / middleware | `backend/src/app.module.ts`, `backend/src/main.ts` |
| Navegación, rutas y permisos UI | `frontend/src/App.tsx`, `frontend/src/rbac/` |
| Contrato HTTP del frontend | `frontend/src/api/<área>.api.ts`, `api/client.ts` |
| Modelo de datos | `backend/prisma/schema.prisma` |
| Venta, cobro, stock y reversión | `backend/src/domains/sales/checkout.orchestrator.ts` |
| Stock / reservas | `backend/src/domains/logistics/inventory.service.ts` |
| Precios / promociones | `backend/src/domains/catalog/pricing.service.ts`, `rules-engine.service.ts` |
| Pantallas / componentes del área | `frontend/src/pages/`, `frontend/src/features/` |
| Configuración / credenciales cifradas | `backend/src/modules/settings/`, `backend/src/core/crypto/` |
| Despliegue | `docker-compose.yml`, `docs/docker-deployment.md` |

## Invariantes y puntos delicados

- Operar sobre variantes; distinguir producto, variante, combo, depósito y sucursal. El stock físico pertenece al depósito.
- Checkout recalcula precios; admite overrides/descuentos sujetos a permisos y autorización. No confiar en el total del cliente.
- Mantener el ID original de la venta al reintentar: checkout consulta `dto.id` y retorna `ALREADY_PROCESSED` si existe. No confundir ID de operación offline con ID de venta.
- Ventas POS requieren turno abierto; el modo `STRICT` restringe al usuario que abrió el turno.
- Cotizaciones no impactan stock/finanzas al crearse. Checkout reserva para `PENDING_PAYMENT`; otras ventas con depósito deducen stock. Verificar la transición concreta antes de cambiar pago, despacho o cancelación.
- Mutaciones de venta, redenciones, inventario y finanzas se coordinan con transacciones y servicios que reciben `tx`. Conservar atomicidad y evitar duplicar asientos.
- Factura fiscal y venta tienen ciclos separados; ARCA usa la cola `afip_invoices`.
- Sesión ERP: cookie HttpOnly `erp_token`; tienda: `storefront_token` y estrategia separada. No reintroducir tokens en localStorage.
- Seguridad efectiva en guards/controladores backend; ocultar botones o rutas no sustituye autorización.
- `/api` es el prefijo REST; `/health` queda fuera. `/uploads` sirve archivos; `/uploads/arca` y `/uploads/backups` están bloqueados públicamente.

## Hechos operativos esenciales

- Desarrollo: frontend 3000 → proxy backend 3001 para `/api` y `/uploads`. Docker: backend 3000 **interno**, web Nginx 80.
- Mantener `NODE_ENV=production`: configuración alternativa exige `pino-pretty`, ausente en package.json.
- Arranque requiere `JWT_SECRET`; producción requiere también `SETTINGS_ENCRYPTION_KEY`.
- Backend `npm run lint` ahora ejecuta TypeScript (`tsc --noEmit`), no ESLint. Frontend `npm run build` usa Vite y no reemplaza un chequeo TypeScript.
- Se usa `prisma db push`; no tratar migraciones históricas como baseline vigente.
- En esta revisión `git ls-files '*node_modules*'` devolvió cero: la advertencia histórica de dependencias versionadas ya no describe este checkout.
- Hay 65 archivos unitarios `*.spec.ts`; no afirmar que pasan 246 tests sin ejecutar la suite actual. E2E modifica DB y puede omitirse si no está disponible.

## Alcance de la revisión

Se inspeccionaron estructura, manifiestos, arranque, módulos, rutas, esquema, servicios centrales, persistencia offline, configuración Docker y preparación de tests. No se ejecutaron builds/tests ni se conectó a DB o proveedores. La existencia de un adaptador no demuestra su funcionamiento con credenciales reales. Ver hallazgos y precauciones concretas en PROJECT_OPERATIONS.md.
