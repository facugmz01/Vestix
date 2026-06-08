import { get, post, patch } from './client';
import { cleanParams } from './requestUtils';
import type { Integration, WebhookLog, PagedResponse } from '@/types';

export interface WebhookLogsFilters {
  page?: number;
  pageSize?: number;
  success?: boolean;
  direction?: string;
}

export const integrationsApi = {
  getAll: () =>
    get<Integration[]>('/integrations'),

  getOne: (id: string) =>
    get<Integration>(`/integrations/${id}`),

  saveConfig: (id: string, config: Record<string, string>) =>
    patch<Integration>(`/integrations/${id}/config`, { config }),

  toggleActive: (id: string, isActive: boolean) =>
    patch<Integration>(`/integrations/${id}/toggle`, { isActive }),

  testConnection: (id: string) =>
    post<{ success: boolean; message: string }>(`/integrations/${id}/test`, {}),

  triggerSync: (id: string) =>
    post<{ message: string }>(`/integrations/${id}/sync`, {}),

  getWebhookLogs: (id: string, filters?: WebhookLogsFilters) =>
    get<PagedResponse<WebhookLog>>(`/integrations/${id}/webhook-logs`, { params: cleanParams(filters ?? {}) }),

  retryWebhook: (integrationId: string, logId: string) =>
    post<WebhookLog>(`/integrations/${integrationId}/webhook-logs/${logId}/retry`, {}),

  getFailedAfipJobs: () =>
    get<FailedAfipJob[]>('/afip/failed-jobs'),

  retryAfipJob: (id: string) =>
    post<{ success: boolean; message: string }>(`/afip/retry-job/${id}`, {}),

  getWcMappings: () =>
    get<any[]>('/integrations/woocommerce/mappings'),

  saveWcMapping: (variantId: string, wcProductId: number, wcVariationId: number) =>
    post<{ success: boolean }>('/integrations/woocommerce/mappings', { variantId, wcProductId, wcVariationId }),

  deleteWcMapping: (variantId: string) =>
    post<{ success: boolean }>('/integrations/woocommerce/mappings/delete', { variantId }),

  searchVariants: (search: string) =>
    get<any[]>('/variants', { params: { search } }),
};

export interface FailedAfipJob {
  id: string;
  name: string;
  data: { orderId: string; branchId: string };
  failedReason: string;
  attemptsMade: number;
  failedAt: string;
}
