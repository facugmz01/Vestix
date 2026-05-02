# Day 2 Operations & Monitoring Checklist

## Daily Tasks
- [ ] **Check AFIP Dead-Letter Queue**: Review the BullMQ `afip_invoices` failed jobs. Resolve manually (e.g., correct CUIT in DB) and requeue.
- [ ] **Review Price Variances**: Open the `SaleOrderVariance` table/dashboard. Review records where `resolved: false`. These represent offline sales that were tampered with or used outdated catalogs.
- [ ] **Check System Audit Logs**: Run anomaly queries on the `AuditLog` table for action `ACCESS_DENIED`.

## Weekly Tasks
- [ ] **Stock Reservation Cleanup Verification**: Ensure the `ReservationExpiryJob` is running and there are no `ACTIVE` `StockReservation` records with `expiresAt` older than 1 hour.
- [ ] **Database Vacuum/Analyze**: Monitor PostgreSQL index bloat, specifically on `InventoryMovement` and `AuditLog`.

## Monitoring Alerts (To configure in PagerDuty/Datadog)
- **CRITICAL**: `POST /api/auth/login` 5xx rate > 1%.
- **CRITICAL**: `GET /api/health` failing.
- **HIGH**: Redis CPU > 80% or OOM (will block AFIP queue and offline sync).
- **HIGH**: `PrismaClientKnownRequestError` spikes in logs.
- **MEDIUM**: Sync Engine `409 Conflict` rate spiking (indicates heavy concurrent edits on branches).
