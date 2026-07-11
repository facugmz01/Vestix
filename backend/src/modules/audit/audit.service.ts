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
   * Paginated audit log query for the admin UI.
   */
  async findAll(filters: {
    page?: number;
    pageSize?: number;
    userId?: string;
    module?: string;
    action?: string;
    entityType?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, any> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.resource = filters.entityType;
    if (filters.search?.trim()) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { userEmail: { contains: filters.search, mode: 'insensitive' } },
        { resourceId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: rows.map(row => this.mapToApi(row)),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string) {
    const row = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!row) return null;
    return this.mapToApi(row);
  }

  async getEntityTrace(entityType: string, entityId: string) {
    const rows = await this.getResourceHistory(entityType, entityId);
    return rows.map(row => ({
      id: row.id,
      action: row.action,
      module: row.module ?? '',
      description: row.description ?? '',
      userName: row.userEmail ?? row.userId ?? 'Sistema',
      createdAt: row.createdAt.toISOString(),
      changes: this.mapChanges(row.previousValue, row.newValue),
    }));
  }

  private mapToApi(row: {
    id: string;
    userId: string | null;
    userEmail: string | null;
    ipAddress: string | null;
    action: string;
    resource: string;
    resourceId: string | null;
    previousValue: unknown;
    newValue: unknown;
    module: string | null;
    description: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId ?? '',
      userName: row.userEmail ?? row.userId ?? 'Sistema',
      userEmail: row.userEmail ?? '',
      action: row.action,
      module: row.module ?? '',
      entityType: row.resource,
      entityId: row.resourceId ?? undefined,
      description: row.description ?? '',
      ipAddress: row.ipAddress ?? undefined,
      changes: this.mapChanges(row.previousValue, row.newValue),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapChanges(previousValue: unknown, newValue: unknown) {
    if (!previousValue && !newValue) return undefined;
    const before = (previousValue ?? {}) as Record<string, unknown>;
    const after = (newValue ?? {}) as Record<string, unknown>;
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const key of keys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = { before: before[key], after: after[key] };
      }
    }
    return Object.keys(changes).length ? changes : undefined;
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

