# Vestix Mobile

Documentación de referencia para diseñar, construir, probar y publicar una aplicación móvil conectada a Vestix ERP + POS.

## Documentos

| Documento | Uso |
|---|---|
| [product-spec.md](product-spec.md) | Alcance funcional, roles, pantallas y criterios de aceptación. |
| [architecture.md](architecture.md) | Arquitectura propuesta, estructura del proyecto, estado, navegación y observabilidad. |
| [api-contract.md](api-contract.md) | Contrato móvil sobre la API actual y cambios de backend requeridos. |
| [offline-sync.md](offline-sync.md) | Diseño de catálogo offline, cola, idempotencia, conflictos y recuperación. |
| [security-qa-release.md](security-qa-release.md) | Seguridad, privacidad, pruebas, CI/CD, distribución y operación. |
| [implementation-roadmap.md](implementation-roadmap.md) | Fases, entregables y dependencias bloqueantes. |

## Decisión de producto

La primera versión recomendada es una app interna para personal de sucursales, depósitos, reparto y supervisión. El storefront público móvil se considera una superficie separada: ya existe como PWA/web y no debe mezclarse con la sesión ERP, sus permisos ni su almacenamiento local.

## Estado de compatibilidad

- La API REST usa el prefijo `/api`; `/health` queda fuera del prefijo.
- El backend expone sesión ERP mediante cookie `erp_token` HttpOnly. Para una app nativa se debe agregar un flujo de sesión móvil con tokens de corta duración y refresh rotativo, o validar formalmente un cliente de cookies nativo antes de iniciar desarrollo.
- `POST /api/offline/sync` ya existe para lotes POS con `batchId`, `deviceId`, `branchId` y operaciones idempotentes por `clientGeneratedId`.
- La aplicación móvil no debe confiar en precios, stock, permisos ni totales calculados localmente: el servidor sigue siendo la autoridad.
- Esta documentación describe una propuesta de implementación; no afirma que los cambios de backend móvil ya estén hechos.

## Fuente de verdad

Los controladores, DTOs, guards y `backend/prisma/schema.prisma` prevalecen sobre este documento cuando difieran. Para cambios de arquitectura o flujos, actualizar también `docs/PROJECT_MEMORY.md`, `docs/PROJECT_MAP.md` y `docs/PROJECT_OPERATIONS.md`.
