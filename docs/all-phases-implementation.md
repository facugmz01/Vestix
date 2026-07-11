# Plan Maestro — Todas las Fases (Julio 2026)

Implementación coordinada por agentes con **doble validación**:
1. Tests automatizados (unit + E2E cuando hay DB)
2. Agente revisor independiente (build + revisión de código)

## Fase 0 — Bloqueantes de producción ✅

| Entrega | Archivos clave | Validación |
|---------|----------------|------------|
| Estrategia migraciones Prisma | `docs/prisma-migrations-strategy.md` | Doc review |
| Checklist homologación AFIP | `docs/afip-homologation-checklist.md` | Doc review |
| Framework E2E | `backend/test/e2e/*.e2e-spec.ts`, `npm run test:e2e` | 7 tests (skip sin PG) |

## Fase 1 — Quick wins ✅

| Entrega | Archivos clave | Validación |
|---------|----------------|------------|
| Export real de reportes CSV | `report-export.service.ts` | 56 tests reports+returns |
| Nav delivery + integraciones | `frontend/src/navigation/navConfig.tsx` | Frontend build |
| Flujo devoluciones PENDING→approve | `returns.service.ts`, `ReturnDetailDrawer.tsx` | Unit + UI |

## Fase 2 — Fiscal Argentina ✅

| Entrega | Archivos clave | Validación |
|---------|----------------|------------|
| Factura C (Monotributo/Exento) | `afip-voucher.util.ts` | 12 tests |
| Multi-IVA (21/10.5/27/0%) | `afip.service.ts`, `splitAmountsForMultiVat` | afip.service.spec |
| Notas de Débito | `afip.processor.ts`, `POST /finance/invoices/debit-note` | Processor tests |
| Libro IVA ventas/compras | `libro-iva.service.ts` | 5 tests |

## Fase 3 — Deuda técnica ✅

| Entrega | Archivos clave | Validación |
|---------|----------------|------------|
| Eliminación módulos legacy | `backend/src/modules/{sales,purchasing,treasury,transfers,identity}/` | 288 tests |
| AFIP solo async (BullMQ) | `invoicing.service.ts` | invoicing.service.spec |
| Consolidación API compras | `purchases.api.ts` (eliminado `purchasing.api.ts`) | Frontend build |

## Fase 4 — Retail ✅

| Entrega | Archivos clave | Validación |
|---------|----------------|------------|
| COMBO → stock componentes | `combo-stock.util.ts`, `checkout.orchestrator.ts` | 4 tests |
| Loyalty (puntos) | `loyalty/` module | 6 tests |
| Colecciones/temporadas | `collections/` CRUD | 3 tests |
| Gift cards | `gift-cards/` module | 6 tests |

## Métricas finales

- **288 tests unitarios** pasando (46 suites)
- **Backend build** OK
- **Frontend build** OK
- **E2E**: requiere PostgreSQL + Redis (`sudo pg_ctlcluster 16 main start`)

## Pendiente operativo (no código)

1. Homologación AFIP con certificados reales del negocio
2. Mapeo variantes Shopify en admin
3. `prisma migrate deploy` en primer deploy de producción
4. ~~UI frontend para loyalty, gift cards, colecciones (APIs listas)~~ → Admin UI implementada (Jul 2026)

## Protocolo doble validación

```
Agente implementador → tests + build
        ↓
Agente validador → npm test + npm run build + revisión manual
        ↓
Coordinador → merge conflictos, fix imports, PR
```
