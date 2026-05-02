import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export enum AuditAction {
  CREATE       = 'CREATE',
  UPDATE       = 'UPDATE',
  DELETE       = 'DELETE',
  LOGIN        = 'LOGIN',
  LOGOUT       = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPORT       = 'EXPORT',
  RECONCILE    = 'RECONCILE',
}

export interface LogPayload {
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  requestId?: string;
  action: AuditAction | string;
  resource: string;
  resourceId?: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  module: string;
  description?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * PRIMARY API — persists an audit record to the immutable PostgreSQL AuditLog table.
   * Fire-and-forget safe: caller may `.catch(() => {})` and the app will never crash.
   */
  async log(payload: LogPayload): Promise<void> {
    const safeNewValue      = this.sanitize(payload.newValue);
    const safePreviousValue = this.sanitize(payload.previousValue);

    try {
      await this.prisma.auditLog.create({
        data: {
          userId:        payload.userId,
          userEmail:     payload.userEmail,
          ipAddress:     payload.ipAddress,
          action:        payload.action,
          resource:      payload.resource,
          resourceId:    payload.resourceId,
          previousValue: safePreviousValue ?? undefined,
          newValue:      safeNewValue ?? undefined,
          module:        payload.module,
          description:   payload.description,
        }
      });
    } catch (err) {
      // Audit failure must never crash the application
      this.logger.error(`[AuditService] FAILED to persist audit log: ${err}`);
    }

    this.logger.log(
      `[Audit] ${payload.action} | ${payload.resource} ${payload.resourceId ?? ''} | User: ${payload.userId}`
    );
  }

  /**
   * CHANGE HISTORY: Full timeline for a single entity.
   */
  async getResourceHistory(resource: string, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: { resource, resourceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * USER TRAIL: Full activity timeline for a single user.
   */
  async getUserTrail(userId: string, fromDate?: Date, toDate?: Date) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * SECURITY REPORT: All access denial events in the last 24h (default).
   */
  async getSecurityEvents(fromDate?: Date) {
    const since = fromDate ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.auditLog.findMany({
      where: {
        action: AuditAction.ACCESS_DENIED,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * MODULE ACTIVITY: All events scoped to a specific business module.
   */
  async getModuleActivity(module: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { module },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── INTERNAL UTILITIES ──────────────────────────────────────────────────────

  /**
   * Strips sensitive fields from before/after diff snapshots.
   * Critical for GDPR/PCI-DSS compliance — raw passwords/tokens are never stored.
   */
  private sanitize(value?: Record<string, any>): Record<string, any> | undefined {
    if (!value) return undefined;
    const BLOCKED_KEYS = ['password', 'passwordHash', 'token', 'secret', 'cardNumber', 'cvv', 'accessToken'];
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, BLOCKED_KEYS.includes(k) ? '[REDACTED]' : v])
    );
  }
}

