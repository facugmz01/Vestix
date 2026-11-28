# Vestix SaaS v1: arquitectura y plan de transición

**Estado:** propuesta de arquitectura para revisión  
**Fecha:** 2026-11-23  
**Alcance:** nuevo producto SaaS inspirado por el prototipo `frontend/prototypes/redesign-v1/`. No es una autorización para desplegar ni migrar datos reales.

## 1. Resumen de la propuesta

Crear un proyecto SaaS paralelo, con infraestructura y datos aislados, y mantener el ERP actual como producto operativo independiente durante la transición. La maqueta será la referencia funcional y visual. La interfaz SaaS se implementará como una aplicación nueva, sin importar los componentes ni las hojas de estilo legacy.

Reutilizar de forma selectiva los dominios de negocio y contratos del backend actual, después de adaptarlos a un contexto de empresa. No conectar una nueva interfaz directamente al backend actual como si ya fuera multiempresa: el esquema Prisma revisado no contiene un modelo de empresa/tenant ni campos `tenantId`, y las entidades principales tienen unicidad global, por ejemplo usuario, sucursal, categoría, marca, SKU, proveedor y lista de precios.

La unidad de aislamiento propuesta es la **empresa (tenant)**. Sus sucursales, depósitos, catálogo, precios, compras, ventas, finanzas y archivos pertenecen a esa empresa. Los usuarios pueden pertenecer a una o varias empresas mediante membresías explícitas.

## 2. Hechos actuales y consecuencias

El producto actual es un ERP/POS modular con backend NestJS, Prisma y PostgreSQL, Redis/BullMQ, y frontend React 18 con Vite. PostgreSQL agrupa los modelos en siete esquemas: `core`, `catalog`, `inventory`, `sales`, `purchasing`, `finance` y `settings`. El mapa de áreas vigente está en `docs/PROJECT_MAP.md`.

La maqueta es un prototipo HTML/CSS/JavaScript autónomo. Incluye patrones para catálogo, productos y variantes, listas de precios, proveedores, inventario, ventas y POS. Sus datos son de demostración y algunas interacciones sólo viven en memoria del navegador. Sirve para acordar comportamiento y jerarquía visual; no sustituye APIs, validaciones de servidor, permisos ni persistencia.

La adaptación SaaS debe revisar también los flujos que no se ven completos en la maqueta: identidad y roles, clientes, compras/recepciones, cuentas y cajas, ARCA, pagos, integraciones, informes, offline/PWA, archivos y auditoría.

## 3. Decisiones recomendadas para v1

| Tema | Recomendación inicial | Condición para revisarla |
|---|---|---|
| Repositorio | Crear `vestix-saas` como proyecto independiente; versionar arquitectura, app y API nuevas allí. | Si se decide un monorepo formal, definirlo antes de compartir código o pipelines. |
| Interfaz | Reimplementar los flujos aprobados en React usando el prototipo como especificación visual. Crear tokens, componentes y contratos nuevos. | Importar un asset del prototipo sólo si se comprueba que es autocontenido y mantenible. |
| Backend | Mantener NestJS/Prisma como base tecnológica conocida; crear un contexto de tenant obligatorio y portar casos de uso por módulo. | Reescritura tecnológica sólo con justificación de coste, capacidades y soporte. |
| Base de datos | Evaluar PostgreSQL compartido con pertenencia explícita a tenant y controles en cada ruta; añadir Row-Level Security (RLS) como defensa en profundidad cuando Prisma/transactions lo permitan de forma verificable. | Elegir esquema o base por tenant si el perfil de clientes, contratos, residencia, recuperación o aislamiento lo exige. |
| Datos globales | Marcar explícitamente los recursos de plataforma/globales. Todo lo demás debe clasificarse como tenant-owned o user-owned. | No inferir que un registro es global sólo porque hoy tenga unicidad global. |
| Migración | Patrón de estrangulamiento: habilitar módulos en el producto nuevo gradualmente; conservar la aplicación actual durante la validación y transición. | No realizar corte de escrituras hasta acordar piloto, equivalencia, reversión y responsable. |

La opción de base compartida reduce el coste operativo para el piloto, pero sólo es aceptable con aislamiento aplicado de forma consistente. OWASP recomienda derivar el contexto de tenant de identidad y membresía verificadas, delimitar consultas, claves de caché, objetos y trabajos asíncronos, y probar expresamente la denegación entre tenants. [OWASP Multi-Tenant Security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)

## 4. Modelo SaaS de dominio

### Entidades de plataforma

- **Tenant / Empresa:** cuenta comercial y límite de aislamiento.
- **Membership:** relación usuario-empresa, estado, rol y permisos. El selector de empresa permite elegir una membresía; nunca concede acceso por sí mismo.
- **Subscription / Entitlement:** plan, estado, límites y módulos habilitados. Separar estos conceptos de la facturación operativa del ERP.
- **Platform operator:** identidad y permisos administrativos del proveedor SaaS, separados de los administradores de cada empresa.

### Entidades de negocio

Sucursal y depósito pertenecen a una empresa. Productos, categorías, marcas, proveedores, listas de precios, clientes, stock, compras, ventas, cuentas, cajas, configuraciones e integraciones quedan en el tenant que los administra. Cada relación entre registros debe validar que ambos lados pertenecen al mismo tenant.

Los datos de usuario pueden ser globales al inicio de sesión, pero el acceso a funciones empresariales se decide mediante la membresía activa y el permiso correspondiente. Evitar que un único `roleId` global represente todos los roles de una persona en todas sus empresas.

### Autorización y contexto de tenant

1. Autenticar al usuario.
2. Resolver la empresa activa y verificar que el usuario conserva una membresía válida.
3. Construir un contexto de tenant confiable en el servidor para la petición.
4. Aplicar permisos y filtrar cada lectura/escritura por tenant.
5. Verificar también el tenant de recursos relacionados antes de mutarlos o devolverlos.

El identificador enviado por cliente, URL o cabecera puede seleccionar el contexto, pero nunca es prueba de autorización. NestJS Guards son un punto adecuado para centralizar autenticación/autorización; los servicios y repositorios deben seguir aplicando el ámbito de datos. [NestJS Guards](https://docs.nestjs.com/guards), [NestJS Authorization](https://docs.nestjs.com/security/authorization)

PostgreSQL RLS puede aportar una segunda barrera. Las políticas requieren una implementación cuidadosa y validación sobre el rol de base de datos y el pool de conexiones; la documentación de PostgreSQL explica que las políticas aplican a las operaciones cubiertas y que roles privilegiados/propietarios pueden tener tratamiento distinto. [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## 5. Arquitectura del nuevo proyecto

Estructura inicial sugerida, ajustable al crear el repo:

```text
vestix-saas/
  apps/
    web/                 # React: interfaz SaaS nueva, responsive, sin UI legacy
    api/                 # NestJS: identidad, tenancy y módulos de negocio
  packages/
    design-system/       # tokens, componentes accesibles y temas claro/oscuro
    contracts/           # DTOs/contratos tipados cliente-servidor
  docs/
    adr/                 # decisiones arquitectónicas fechadas
    migration/           # inventario, mapeos, reconciliación y reversión
```

El diseño debe extraer de la maqueta una especificación estable: navegación, estados vacíos/carga/error, formularios, tablas y flujos por rol; paleta y tokens; responsive; accesibilidad; y estados de interacción. Implementar las reglas de negocio en API, no en el cliente. El modo oscuro debe usar tokens del sistema nuevo, con preferencia del usuario guardada en su perfil cuando exista identidad real.

La API debe añadir contexto tenant-aware a colas, outbox, caché Redis, rate limits, auditoría, exportaciones y almacenamiento de archivos. Los trabajos diferidos deben transportar el contexto de forma confiable y volver a verificarlo en el consumidor; las claves de caché y rutas de objetos no deben ser compartidas sin ámbito. La cola offline/PWA debe aislar catálogo y operaciones por empresa, incluida la salida de sesión o cambio de tenant.

## 6. Plan de ejecución por fases

### Fase 0 — Decisiones y mapa de alcance

- Confirmar perfil inicial de cliente, sucursales por empresa, roles, módulos, modelo de suscripción y requisitos de soporte.
- Inventariar los modelos Prisma, APIs, jobs, archivos y cachés; clasificarlos como plataforma, tenant o usuario.
- Dibujar las relaciones entre datos y encontrar unicidades globales que deben cambiar a unicidad dentro de tenant.
- Aprobar estrategia de aislamiento, autenticación y migración antes de añadir datos reales.

**Salida:** ADR de tenancy, mapa de entidades y flujos priorizados del MVP.

### Fase 1 — Fundación aislada

- Crear repo, pipelines y entornos exclusivos: desarrollo, preproducción, base, Redis y almacenamiento separados del ERP existente.
- Crear identidad, empresas, membresías, selector de empresa, permisos y auditoría base.
- Implementar middleware/guard/contexto tenant y repositorios tenant-aware.
- Establecer límites de logs, copias de seguridad, retención y secretos sin copiar `.env` ni certificados.

**Criterio de salida:** pruebas negativas demuestran que una empresa no accede a datos de otra por API, ID directo, exportación, trabajo en cola o archivo.

### Fase 2 — Primer corte vertical y piloto sintético

Migrar interfaz y API por flujos completos, priorizando el orden de dependencias:

1. Datos del catálogo: categorías, marcas, atributos, proveedores.
2. Productos, variantes y medios.
3. Listas de precios y actualización masiva.
4. Sucursales, depósitos e inventario.
5. Compras, recepciones y proveedores.
6. POS, ventas, cobros y devoluciones.
7. Finanzas, ARCA, integraciones, reportes y offline según el alcance acordado.

En cada corte: definir contrato; implementar pantalla, permiso y API; migrar reglas existentes con revisión de pruebas; verificar tenant aislado; comparar resultados de negocio con el flujo actual; documentar límites funcionales.

**Criterio de salida:** piloto con datos sintéticos y al menos dos tenants de prueba, con casos válidos y negativos comprobados.

### Fase 3 — Ensayo de migración de datos

- Mapear la empresa actual a un tenant inicial, preservando IDs donde sea seguro y posible.
- Crear un proceso repetible e idempotente de extracción, transformación y carga; no editar bases manualmente para completar el proceso.
- Reconciliar cantidades, relaciones, precios, stock, saldos, identificadores y adjuntos por dominio.
- Probar restauración/reversión y definir congelamiento de escrituras, sincronización final y responsables del corte.

**Criterio de salida:** informe firmado de reconciliación, plan de reversión probado y aceptación del dueño funcional antes de decidir un corte real.

### Fase 4 — Activación y coexistencia

- Activar primero para usuarios piloto con soporte y monitoreo definidos.
- Evitar doble escritura improvisada entre sistemas; si hace falta coexistencia, definir sistema dueño por entidad y mecanismo de reconciliación.
- Ampliar módulos y clientes por etapas; mantener el sistema anterior recuperable durante el período acordado.
- Retirar o archivar la aplicación anterior sólo tras validar uso, soporte, retención y exportación de datos.

## 7. Seguridad, calidad y operaciones: requisitos de aceptación

- Toda entidad tenant-owned tiene una pertenencia verificable; relaciones y unicidades no pueden cruzar tenants.
- Toda consulta tenant-scoped tiene contexto server-verified; las rutas de plataforma cross-tenant son excepcionales, explícitas, autorizadas y auditadas.
- Pruebas con tenant A y B cubren lecturas/escrituras, búsquedas, IDs directos, bulk operations, informes, archivos y exportaciones.
- Jobs, caché, outbox, webhooks, notificaciones y offline llevan alcance correcto y evitan colisiones entre tenants.
- Se miden cuotas, límites de concurrencia y disponibilidad para reducir el efecto de un cliente ruidoso.
- Backups y restauraciones permiten recuperar un tenant de forma controlada sin exponer datos de otros.
- Migraciones son versionadas, revisables y probadas en entorno aislado; producción no comparte credenciales ni infraestructura con desarrollo/preproducción.
- Los permisos de plataforma no se derivan de ser administrador de una empresa. Las operaciones de soporte quedan acotadas y auditadas.

Si RLS se usa como frontera secundaria, verificar explícitamente las políticas activas, tablas cubiertas y privilegios del rol de aplicación; PostgreSQL advierte que la aplicación de políticas depende de cómo se habilitan y de los privilegios del rol. [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## 8. Riesgos y decisiones todavía abiertas

1. **Nivel de aislamiento:** base compartida con RLS, schema por tenant o base por tenant. Evaluar escala prevista, costo, contratos, recuperación y carga operativa antes de fijarlo.
2. **Usuarios multiempresa:** definir si un email representa una persona global con múltiples membresías o si existen cuentas separadas por tenant; la experiencia de invitación y recuperación depende de ello.
3. **Plan y cobro SaaS:** definir módulos, cuotas, período de prueba, cancelación, mora, facturas del servicio SaaS y proveedor de pagos. No confundir esa facturación con comprobantes de ventas del ERP.
4. **Datos fiscales e integraciones:** determinar titularidad, certificados, secretos, límites y proceso de autorización por empresa antes de habilitar ARCA, Mercado Pago o ecommerce.
5. **Datos offline y PWA:** acordar qué funciones pueden operar sin conexión y cómo invalidar datos locales al cambiar de empresa o usuario.
6. **Migración/corte:** seleccionar una ventana y un responsable de negocio sólo cuando existan resultados de ensayo y reversión aprobados.

## 9. Próximo entregable recomendado

Antes de crear el repositorio nuevo, preparar el **ADR de tenancy** y el inventario modelo-por-modelo: dueño (plataforma/tenant/usuario), clave de tenant, unicidades, relaciones, API/worker consumidor y plan de migración. Ese documento convertirá esta propuesta en una base implementable y permitirá estimar el MVP.

## Referencias técnicas

- [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [NestJS: Guards](https://docs.nestjs.com/guards)
- [NestJS: Authorization](https://docs.nestjs.com/security/authorization)
- Contexto local: `docs/PROJECT_MEMORY.md`, `docs/PROJECT_MAP.md`, `docs/PROJECT_OPERATIONS.md`, `backend/prisma/schema.prisma`, `frontend/prototypes/redesign-v1/README.md`.
