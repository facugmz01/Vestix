import { get } from './client';
import { cleanParams } from './requestUtils';
import type { AuditLog, EntityTraceEntry, PagedResponse } from '@/types';

export interface AuditFilters {
  page?: number;
  pageSize?: number;
  userId?: string;
  module?: string;
  action?: string;
  entityType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const auditApi = {
  getLogs: (filters?: AuditFilters) =>
    get<PagedResponse<AuditLog>>('/audit/logs', { params: cleanParams(filters ?? {}) }),

  getLog: (id: string) =>
    get<AuditLog>(`/audit/logs/${id}`),

  getEntityTrace: (entityType: string, entityId: string) =>
    get<EntityTraceEntry[]>(`/audit/trace/${entityType}/${entityId}`),
};
