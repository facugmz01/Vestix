# ADR SaaS-001: aislamiento multiempresa para Vestix SaaS

- **Estado:** Propuesta; pendiente de aprobación
- **Fecha:** 2026-11-23
- **Decisores:** Producto, ingeniería y operación
- **Alcance:** arquitectura del nuevo SaaS. No modifica ni autoriza cambios en producción o en el entorno de test actual.

## Contexto

Vestix hoy es un ERP/POS modular NestJS + Prisma + PostgreSQL. El esquema tiene 71 modelos en siete schemas (`core`, `catalog`, `inventory`, `sales`, `purchasing`, `finance`, `settings`). En `backend/prisma/schema.prisma` no hay modelo Tenant/Empresa ni campo `tenantId`. Muchas claves de negocio (`User.email`, `Branch.code`, `Category.name`, `Brand.name`, `Product.baseSku`, `Supplier.taxId`, `PriceList.name`) se declaran únicas globalmente. La aplicación actual debe tratarse como single-tenant hasta que una implementación y pruebas demuestren lo contrario.

La maqueta `frontend/prototypes/redesign-v1/` es HTML/CSS/JavaScript autónomo con interacciones de demostración. Se usará como especificación de interfaz, no como capa de seguridad o backend.

## Decisión propuesta

Para el MVP SaaS, evaluar y usar **PostgreSQL compartido con filas tenant-scoped**, bajo estas condiciones obligatorias:

1. Crear `Tenant` (empresa/cuenta) y `TenantMembership` (usuario, empresa, estado, rol/scope). La identidad puede ser global; sus accesos empresariales siempre derivan de una membresía activa.
2. Clasificar cada entidad como **plataforma**, **tenant** o **usuario global** antes de modificarla. El inventario modelo-por-modelo está en [saas-data-inventory-v1.md](saas-data-inventory-v1.md).
3. Añadir `tenantId` directamente a cada entidad de negocio tenant-scoped, incluidas líneas, logs o tablas satélite que necesiten filtros, RLS, búsquedas o auditoría. Mantenerlo consistente con la entidad padre mediante FK/constraints compuestos cuando sea viable. Una relación indirecta no reemplaza la autorización en API.
4. Resolver el tenant desde identidad autenticada + membresía validada en el servidor. Un ID recibido de URL, cuerpo o cabecera sólo selecciona el contexto; no prueba acceso.
5. Toda ruta, servicio, repositorio, job y exportación tenant-scoped aplica el tenant validado. Las operaciones cross-tenant de plataforma son explícitas, de mínimo privilegio, auditadas y separadas del camino normal.
6. Cambiar las unicidades funcionales de datos tenant-owned a claves compuestas con `tenantId`. Mantener unicidad global sólo para identidades o recursos que se decidan realmente globales.
7. Usar **Row-Level Security (RLS)** como segunda barrera de aislamiento si se valida la integración con Prisma y el pool. Establecer el contexto con alcance de transacción mediante el cliente de transacción; nunca dejar un tenant de sesión pegado a una conexión reutilizada. El rol ordinario de la app no puede ser superusuario ni tener `BYPASSRLS`.
8. No introducir escrituras duplicadas entre el sistema actual y el SaaS. Durante coexistencia, documentar para cada dominio qué sistema es autoridad y cómo se sincroniza o reconcilia.

La selección de base compartida es provisional: proporciona un camino de operación razonable para el piloto, pero la alternativa de schema o base por tenant debe seguir disponible si el aislamiento contractual, la residencia, la recuperación o la escala lo exigen.

## Modelo de identidad y autorización

- `User` representa una persona autenticable y conserva credenciales y MFA. `email` permanece globalmente único en la propuesta de identidad global.
- `Tenant` representa la empresa cliente. Contiene el estado operativo y el plan/entitlements referenciados, no las credenciales de integración sin cifrar.
- `TenantMembership` relaciona usuario con tenant; tiene estado, invitación/aceptación, rol de tenant y, si aplica, alcance de sucursal. La combinación usuario + tenant debe ser única.
- Las definiciones de permisos pueden ser globales e inmutables para la plataforma; roles asignables son tenant-scoped. El rol de operador de plataforma se separa del rol de administrador del tenant.
- El tenant activo puede cambiar en la UI. La API vuelve a comprobar la membresía y los permisos en cada petición y al procesar trabajos diferidos.
- Aplicar default-deny. NestJS Guards centralizan autenticación y autorización; los servicios/repositorios aplican también el filtro de datos y validan las entidades relacionadas.

## Diseño de datos e integridad

Para filas tenant-owned, proponer `tenantId` con índice y relaciones a `Tenant`. Para claves de negocio, emplear por ejemplo `@@unique([tenantId, code])` y no `@@unique([code])`. Si una línea referencia encabezado y producto/variante, validar que todos comparten tenant mediante FKs compuestos o validación transaccional garantizada; no basta validar sólo el encabezado.

Los modelos satélite —por ejemplo variantes, líneas de órdenes, entradas de precios, movimientos, notificaciones y registros de sincronización— requieren ámbito identificable aunque su propietario se derive del padre. Para RLS por tabla, un `tenantId` denormalizado con integridad verificada suele ser más comprobable que depender de joins de política.

No migrar todas las unicidades a ciegas: revisar la nulabilidad, colisiones entre empresas, claves de idempotencia offline, identificadores externos por conexión y datos históricos. La matriz de datos señala reglas objetivo, no un script de migración.

## RLS, Prisma y contexto de transacción

La documentación de PostgreSQL indica que las políticas limitan filas sólo cuando RLS está habilitada y que propietarios/roles privilegiados pueden tener comportamiento distinto. En Prisma, la opción propuesta es una transacción explícita que establece el tenant localmente y ejecuta las lecturas/escrituras con ese cliente transaccional. Debe verificarse en el pool real, con rollback y conexiones reutilizadas. Si el código no puede garantizar ese patrón en todos los caminos (incluidos `$transaction`, jobs y tareas de sistema), RLS no se declarará frontera efectiva hasta cerrar esa brecha.

RLS es defensa adicional, no sustituto de guards, permisos, filtros de servicio, constraints compuestos, pruebas negativas ni auditoría. Las tareas globales (mantenimiento, migración, backups de plataforma) usarán credenciales y rutas separadas de la app tenant.

## Alcance de aislamiento no SQL

El inventario y la implementación deben incluir:

- Redis: tenant en claves, locks, idempotencia, límites y resultados de reportes.
- BullMQ/outbox/cron/webhooks: contexto verificado por tenant, reautorización al consumir y trazabilidad del actor/empresa.
- Archivos: ownership verificado antes de upload, descarga o URL firmada; namespaces de objetos con límite exacto de tenant.
- Offline/PWA: base local, catálogo y cola de operaciones segmentados por tenant; vaciar o invalidar datos sensibles al cerrar sesión/cambiar empresa de manera controlada, sin perder una cola válida sin una estrategia de sincronización.
- APIs públicas: tokens de tracking/driver/gift card y storefront autorizan únicamente el recurso previsto y no habilitan navegación tenant-wide.
- Logs, auditoría y métricas: tenant asociado desde el contexto verificado; separar auditoría del cliente de auditoría de plataforma; evitar registrar secretos y datos sensibles innecesarios.
- Backups, exportación y restauración: scope explícito, retención definida y pruebas de restauración aislada.

OWASP recomienda no confiar en el tenant informado por el cliente, aplicar aislamiento a todas las rutas de acceso y recursos compartidos, y probar de forma deliberada escenarios cross-tenant. [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)

## Alternativas consideradas

| Alternativa | Ventajas | Costos/riesgos | Decisión |
|---|---|---|---|
| Compartir DB/tablas con `tenantId`, autorización y RLS | Menor coste operativo inicial; consultas y upgrades centralizados. | Alto impacto si se omite un filtro; RLS + pool/ORM requieren disciplina y pruebas. | Recomendada provisionalmente para MVP, con puertas de seguridad obligatorias. |
| Schema PostgreSQL por tenant | Separación visible por schema y posibilidad de algunas políticas por tenant. | Prisma/multi-schema, migraciones y reporting entre muchos schemas elevan complejidad; conexión/search_path debe controlarse. | Mantener como alternativa si hay requisitos concretos. |
| Base por tenant | Mayor separación de datos/backup y opciones de restauración por cliente. | Provisionamiento, conexiones, migraciones, monitoreo y costos crecen por tenant. | Evaluar para clientes con requisitos dedicados; no elegir por defecto sin necesidad. |
| Añadir sólo filtro en frontend o confiar en `tenantId` del request | Implementación aparente rápida. | No es control de seguridad; IDOR/consultas no filtradas exponen datos. | Rechazada. |
| Compartir backend single-tenant actual sin retrofit | Reutiliza pantallas y endpoints existentes. | Modelo, únicas y servicios no están aislados por empresa. | Rechazada para SaaS multiempresa. |

## Migración y coexistencia

1. Congelar el esquema fuente como referencia de inventario; aprobar ADR y clasificación de datos.
2. Crear el esquema destino tenant-aware en infraestructura independiente. No usar producción o la DB de test actual para desarrollar o ensayar esta migración.
3. Implementar identidad, membresías, contexto tenant, autorización y pruebas de aislamiento antes de portar los flujos.
4. Portar módulos verticalmente desde catálogo hasta POS/finanzas. Cada dominio tiene un dueño claro por etapa; evitar doble escritura entre ERP actual y SaaS.
5. Hacer extracción/carga de ensayo desde una copia controlada, preservando UUID donde proceda y generando un reporte de reconciliación por modelo/relación.
6. Ejecutar piloto con datos sintéticos y al menos dos tenants. Probar requests con IDs ajenos, cambios de tenant durante sesión, colas, caché, archivos, exportes, offline, restore y cargas concurrentes.
7. Sólo después de la aceptación funcional y del ensayo de reversión, presentar un plan de corte con ventana, sincronización final y aprobador de negocio. No está incluido en esta ADR.

La estrategia no recomienda dual-write improvisado. Si se requiere coexistencia con datos reales, la migración debe definir un sistema de registro por dominio, captura incremental/idempotente, conciliación y recuperación para evitar divergencias.

## Criterios de aceptación antes de piloto real

- Inventario completo aprobado y cada modelo marcado platform/tenant/user.
- Dos tenants sintéticos no pueden leer, crear, modificar, borrar, exportar ni descubrir referencias del otro mediante API, filtros, IDs directos o relaciones.
- Las restricciones de unicidad permiten los mismos códigos de negocio en empresas distintas cuando corresponda, y evitan duplicados dentro de una empresa.
- RLS (si se adopta) verificada para todas las tablas tenant-owned y con un rol no privilegiado de aplicación.
- Pruebas de pool: contexto tenant no contamina una conexión reutilizada después de éxito, error o rollback.
- Jobs, caché, storage, webhooks, audit, archivos, backups y offline verifican su scope.
- Migración de ensayo idempotente y reconciliación completa; restore/rollback probado.
- Roles y permisos de plataforma y tenant separados, con auditoría de operaciones administrativas.

## Decisiones pendientes de aprobación

1. ¿Identidad global por email y membresías multiempresa? Recomendación: sí.
2. ¿Base compartida con `tenantId` y RLS como defensa adicional para MVP? Recomendación: probar esta vía, no aprobarla hasta validar Prisma/pool y resultados de aislamiento.
3. ¿Marca pertenece a un proveedor único o admite varios? El prototipo actual vincula una marca con un proveedor; definir si esa es una regla de negocio o sólo proveedor principal antes de escoger FK o tabla puente.
4. ¿Qué funciones y límites distinguen planes SaaS? Debe modelarse fuera de roles/permisos de negocio.
5. ¿Qué requerimientos de clientes fuerzan una base dedicada, restauración por tenant o retención diferenciada?

## Referencias

- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP: Multi-Tenant Security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [NestJS: Guards](https://docs.nestjs.com/guards)
- [NestJS: Authorization](https://docs.nestjs.com/security/authorization)
- Evidencia local: `backend/prisma/schema.prisma`; `docs/PROJECT_MAP.md`; `docs/PROJECT_OPERATIONS.md`; `docs/architecture-decisions.md`.
