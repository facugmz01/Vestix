# Vestix: ejecución y estado de la memoria

Revisión estática: 2026-11-03, commit `9e93f46e`. No se ejecutaron tests, builds, migraciones, seeds ni llamadas externas para generar estos documentos.

## Desarrollo y comprobaciones

Aplicaciones independientes; ejecutar comandos desde la carpeta indicada. PostgreSQL y Redis deben estar disponibles. Las instrucciones Linux de AGENTS.md corresponden al entorno Cloud; el checkout revisado está en Windows/PowerShell.

```powershell
# Terminal backend, desde backend/
$env:PORT = '3001'
$env:NODE_ENV = 'production'
npm run start:dev

# Otra terminal, desde frontend/
npm run dev
```

No imprimir ni copiar `.env` a la memoria. Revisar nombres de variables en archivos de ejemplo y en código; conservar claves fuera del repositorio documental. JWT_SECRET es obligatorio y SETTINGS_ENCRYPTION_KEY también en producción. COOKIE_SECURE permite forzar el flag; su valor por defecto deriva de NODE_ENV.

| Comprobación | Comando / alcance |
|---|---|
| Tipos backend | Desde backend: `npm run lint` (hoy es `tsc --noEmit -p tsconfig.json`) |
| Build backend | Desde backend: `npm run build` (limpia dist/tsbuildinfo, luego Nest build) |
| Unitarios backend | Desde backend: `npm test -- --runInBand`; Jest busca src/**/*.spec.ts |
| Test puntual | Desde backend: `npm test -- --runInBand checkout-financial-impact.spec.ts` |
| Tipos frontend | Desde frontend: `npx tsc --noEmit -p tsconfig.json` |
| Build frontend | Desde frontend: `npm run build`; genera bundle/PWA, no ejecuta tsc |
| E2E backend | `npm run test:e2e`; revisar y apuntar a DB de pruebas antes de ejecutar |

E2E `test/e2e/global-setup.ts` ejecuta **db push y seed** sobre DATABASE_URL; el fallback apunta a `erp_prod`. Puede omitir integración si falla preparación. Un proceso exitoso con tests omitidos no acredita integración real. No ejecutarlo sobre datos de trabajo por rutina.

65 archivos unitarios se encontraron en src; no se contabilizaron casos Jest ni se midió cobertura. El número histórico de 246 tests no es una referencia vigente verificada.

## Base de datos y despliegue

- Fuente de esquema: `backend/prisma/schema.prisma`; regenerar Prisma cuando corresponda. No usar `schema.prisma_3` como fuente.
- Estrategia actual: `prisma db push`; consultar `docs/prisma-migrations-strategy.md`. No convertir a migrate deploy sin preparar un baseline.
- Docker: Postgres 16, Redis 7 con AOF, backend Nest y Nginx. Backend escucha 3000 interno; esto es distinto del 3001 de desarrollo con Vite.
- `docker/backend/docker-entrypoint.sh` espera DB y ejecuta `db push --skip-generate`, salvo SKIP_DB_SYNC=true; no incluye accept-data-loss. No ejecuta seed en ese entrypoint.
- Persistencia Docker: volúmenes de PostgreSQL, Redis y uploads. Claves/certificados ARCA y backups viven bajo uploads y no se sirven públicamente.
- Procedimientos: `scripts/docker-install.sh`, `docker-update.sh`, `docker-backup.sh`, `docker-rollback.sh`; guía `docs/docker-deployment.md`. Leer script antes de operar: actualizar/restaurar sí altera servicios y datos.
- Existen scripts históricos `deploy*.sh`, `update_linux.sh` y scripts SQL de producción. No tratarlos como comandos inocuos de diagnóstico.

## Divergencias detectadas en documentación

### Podman local en Windows (2026-11-03)

Stack existente: `vestix-postgres-1`, `vestix-redis-1`, `vestix-backend-1`, `vestix-web-1`; red `vestix_vestix`. Volúmenes: `vestix_vestix_pg_data`, `vestix_vestix_redis_data`, `vestix_vestix_uploads`.

Para actualizar sólo aplicación conservando DB, fijar `SKIP_DB_SYNC=true` en configuración local, construir backend/web y usar `up -d --no-deps --force-recreate backend web`. No ejecutar install, seed, db push ni down con volúmenes. Verificar contenedores existentes antes de operar; nombres y estado pueden cambiar.

Si Compose de Windows falla por el pipe `podman-machine-default`, funciona Compose dentro de `podman machine ssh`, desde la ruta del repo bajo `/mnt/c/`, con `DOCKER_HOST=unix:///run/podman/podman.sock`. La máquina local usa conexión rootful. El puerto web configurado en este stack es 80.

Si BuildKit se estanca transfiriendo contexto desde `/mnt/c`, copiar únicamente fuentes y configuración necesarias a una carpeta temporal del filesystem Linux y compilar allí; excluir node_modules/dist/uploads. Mantener los mismos build args, eliminar cualquier copia temporal de `.env` al terminar y ejecutar la recreación con el Compose del repositorio original.

Importante: Compose/BuildKit puede publicar `docker.io/library/vestix-web:latest` mientras Podman resuelve `vestix-web:latest` a `localhost/vestix-web:latest`, conservando una imagen antigua. Comparar el ID de la imagen compilada con `.Image` del contenedor; reetiquetar explícitamente si divergen. Aplicar la misma comprobación al backend. Con la PWA, cerrar y reabrir la pestaña puede ser necesario para activar la versión nueva.

Si el servicio funciona dentro de Podman pero Windows rechaza localhost:80, el repo incluye `scripts/wsl-port-proxy.js` (launcher `scripts/start-proxy.bat`). Redirige puertos Windows 80 y 3000 al 80 de WSL; comprobar primero que estén libres. Se puede iniciar Node con ventana oculta. Es un proceso del host, no un servicio instalado: puede requerir reinicio tras cerrar sesión o cambiar la IP de WSL.

Validación del despliegue local del 2026-11-03: imágenes backend/web compiladas; 5 tests de `storefront-customer-identity.service.spec.ts` aprobados tras añadir `creditBalance: 0` a dos fixtures. Cuatro contenedores saludables; `/`, `/login`, `/healthz`, `/health` respondieron 200 desde Windows. Se conservó el ID del contenedor PostgreSQL y coincidió la huella de pg_dump schema-only antes/después. No se ejecutó seed ni sincronización de esquema; esto no implica detener las escrituras normales de la aplicación.

1. AGENTS.md decía que lint usa ESLint no instalado; package.json actual usa TypeScript. Se corrigió la nota del archivo.
2. AGENTS.md afirmaba node_modules versionado; git no lista archivos bajo node_modules en este commit. Se sustituyó por una recomendación condicionada a fallos reales.
3. La referencia a 246 tests aprobados no está comprobada hoy; se reemplazó por indicación de ejecutar la suite.
4. `docs/business-rules-summary.md` es intención de negocio: el checkout real admite overrides autorizados y decide reservas/deducciones según estado. No asumir que toda tienda descuenta exclusivamente al despachar.
5. `docs/module-boundaries.md` describe límites deseados; hay módulos globales y orquestación cruzada. No asumir aislamiento rígido de modelos sin inspección.
6. Nombres como StockMovement/TreasuryAccount en textos históricos no sustituyen los modelos vigentes InventoryMovement/FinancialAccount de Prisma.

## Límites y focos de revisión futura

- Esta memoria cubre arquitectura y caminos principales; no es auditoría línea por línea, de seguridad, concurrencia, rendimiento o integridad de producción.
- Idempotencia: se observó consulta previa por ID. Para cambios concurrentes comprobar también constraints, errores de carrera y efectos externos; no dar por probado exactly-once.
- Auditoría middleware: limitada a modelos y acciones enumerados, persistencia asíncrona no bloqueante. Evaluar cobertura de bulk/nested writes si la tarea requiere trazabilidad fuerte.
- Outbox: FAILED no se selecciona en el poll observado; tipos desconocidos permanecen PENDING. Revisar reintentos/handlers si se investigan sincronizaciones detenidas.
- Offline: verificar persistencia, rehidratación, duplicados, conflictos y reconexión en navegador al cambiar el motor; los comentarios no prueban comportamiento.
- Integraciones ARCA, MercadoPago, WooCommerce, Shopify, MercadoLibre, transportistas y notificaciones requieren configuración y comprobación propia. Adaptador presente no significa integración validada.
- Hay layouts/guards y DTOs de nombres similares; seguir imports desde App y módulos registrados para evitar editar una implementación inactiva.

## Mantenimiento para ahorrar contexto

1. Leer PROJECT_MEMORY.md y localizar el área con PROJECT_MAP.md.
2. Usar búsquedas acotadas: `rg -n 'símbolo' backend/src/domains/<área> frontend/src/features/<área>`.
3. Leer servicio, DTO, API/UI y test del flujo afectado; ampliar sólo si aparecen dependencias relevantes.
4. Actualizar un hecho en su documento correspondiente cuando cambie; registrar fecha y fuente, sin copiar grandes fragmentos ni resultados temporales como verdades permanentes.
5. Validar comandos contra package.json; no releer todos los documentos de diseño salvo para una decisión arquitectónica.
