# Database & Application Rollback Plan

## 1. Trigger Conditions for Rollback
Initiate a rollback immediately if any of the following occur within 15 minutes of deployment:
- `GET /api/health` failing continuously for > 1 minute.
- > 5% of checkout transactions returning 500 errors.
- Authentication failures for valid tokens (indicating secret mismatch or bad cookie config).
- Unhandled Promise Rejections or fatal crashes in the backend process.

## 2. Backup Guidance
- **Automated Backups**: Ensure Point-in-Time Recovery (PITR) is enabled on the PostgreSQL instance (e.g., RDS).
- **Pre-deployment Snapshots**: Before executing `prisma migrate deploy` for major schema changes, trigger a manual RDS snapshot.

## 3. Application Rollback Steps (Zero Schema Change)
If the deployment failed due to bad code, but the database schema wasn't destructively altered:
1. Revert the container image or PM2 process to the previous git tag/commit.
2. Restart the backend process.
3. Flush the Redis queue (`afip_invoices`) if the job payload structure changed incompatibly.

## 4. Database Rollback Steps (Schema Corruption)
Prisma does not support automatic "down" migrations. If a bad migration is applied:
1. **Stop Traffic**: Put the application in maintenance mode.
2. **Restore Database**: Restore the pre-deployment snapshot to a new DB instance.
3. **Repoint URL**: Update `DATABASE_URL` to point to the restored instance.
4. **Revert App**: Rollback the application code to the previous version.
5. **Data Loss Mitigation**: Any offline sales generated during the outage will remain in the frontend's IndexedDB queue and will sync safely once the restored system is back online.

## 5. BullMQ Recovery
If the `AfipProcessor` fails systematically due to a bug:
- The jobs will be marked as FAILED but not removed (due to `removeOnFail: false`).
- After reverting the code, use BullMQ's UI (or a custom script) to retry all failed jobs in the `afip_invoices` queue.
