import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuditContextService } from '../audit-context/audit-context.service';

/**
 * Critical models whose mutations MUST produce an audit trail.
 * Coarse-grained: we deliberately exclude high-frequency, low-risk models
 * (e.g., StockLevel.read, search tokens) to prevent audit table bloat.
 */
const AUDITED_MODELS = new Set([
  'SaleOrder',
  'SaleOrderVariance',
  'OrderLineItem',
  'Invoice',
  'Customer',
  'User',
  'PurchaseOrder',
  'TreasuryReceipt',
  'InventoryMovement',
  'StockLevel',
]);

const AUDIT_ACTIONS = new Set(['create', 'update', 'delete', 'upsert']);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly auditContextService: AuditContextService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    // ─── GLOBAL AUDIT MIDDLEWARE ───────────────────────────────────────────────
    // Intercepts all mutations on critical models and writes an immutable audit record.
    // Actor identity is pulled from AsyncLocalStorage, populated by AuditInterceptor.
    this.$use(async (params, next) => {
      const isAudited = AUDIT_ACTIONS.has(params.action) && AUDITED_MODELS.has(params.model ?? '');

      // Capture the before-state for updates and deletes
      let previousValue: Record<string, any> | undefined;
      if (isAudited && (params.action === 'update' || params.action === 'delete') && params.args?.where) {
        try {
          const modelClient = (this as any)[this.toCamelCase(params.model!)];
          previousValue = await modelClient?.findUnique({ where: params.args.where });
        } catch {
          // Non-blocking: if we can't fetch the previous value, we continue anyway
        }
      }

      const result = await next(params);

      if (isAudited) {
        // Pull actor from AsyncLocalStorage — populated by AuditInterceptor on every HTTP request.
        // Falls back to 'system_auto' for background workers (BullMQ, cron jobs, seeds).
        const ctx = this.auditContextService.getContext();

        // Fire-and-forget — never block the main operation for an audit write
        this.auditLog.create({
          data: {
            userId:        ctx?.userId        ?? 'system_auto',
            userEmail:     ctx?.userEmail,
            ipAddress:     ctx?.ipAddress,
            action:        params.action.toUpperCase(),
            resource:      params.model       ?? 'Unknown',
            resourceId:    result?.id?.toString() ?? null,
            previousValue: previousValue      ? this.sanitize(previousValue) : undefined,
            newValue:      result             ? this.sanitize(result)        : undefined,
            module:        'PRISMA_MIDDLEWARE',
            description:   `${params.model} ${params.action}${ctx?.requestId ? ` [req:${ctx.requestId}]` : ''}`,
          }
        }).catch(err => {
          console.error('[PrismaAuditMiddleware] FAILED to persist AuditLog:', err);
        });
      }

      return result;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // ─── UTILITIES ─────────────────────────────────────────────────────────────

  /** Converts PascalCase model name to camelCase accessor (e.g., SaleOrder → saleOrder) */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /** Strips sensitive fields before storing in audit records */
  private sanitize(value: Record<string, any>): Record<string, any> {
    const BLOCKED_KEYS = ['password', 'passwordHash', 'token', 'secret', 'cardNumber', 'cvv', 'accessToken'];
    try {
      const serialized = JSON.parse(JSON.stringify(value)); // Safely strip non-serializable fields
      return Object.fromEntries(
        Object.entries(serialized).map(([k, v]) => [k, BLOCKED_KEYS.includes(k) ? '[REDACTED]' : v])
      );
    } catch {
      return {};
    }
  }
}

