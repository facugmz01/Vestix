import { get, post, patch } from './client';
import { cleanParams } from './requestUtils';
import type {
  NotificationTemplate, NotificationLog, NotificationChannel,
  NotificationEvent, PagedResponse
} from '@/types';

export interface TemplatesFilters { page?: number; pageSize?: number; channel?: string; isActive?: boolean; }
export interface LogsFilters { page?: number; pageSize?: number; status?: string; channel?: string; event?: string; search?: string; }

export interface CreateTemplateDto {
  name: string;
  event: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  isActive: boolean;
}

export interface NotificationStats {
  totals: {
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    bounced: number;
    last24h: number;
  };
  byChannel: Record<string, number>;
  queuePending: number;
  templates: { active: number; total: number };
  recentFailures: Array<{
    id: string;
    event: string;
    channel: string;
    recipient: string;
    errorMessage?: string;
    createdAt: string;
  }>;
}

export interface QueueJob {
  id: string;
  channel: string;
  templateKey: string;
  recipient: string;
  status: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
}

export interface StaffNotification {
  id: string;
  title: string;
  body: string;
  event?: string;
  referenceId?: string;
  readAt?: string | null;
  createdAt: string;
}

export const notificationsApi = {
  // Templates
  getTemplates: (filters?: TemplatesFilters) =>
    get<PagedResponse<NotificationTemplate>>('/notifications/templates', { params: cleanParams(filters ?? {}) }),

  getTemplate: (id: string) =>
    get<NotificationTemplate>(`/notifications/templates/${id}`),

  createTemplate: (dto: CreateTemplateDto) =>
    post<NotificationTemplate>('/notifications/templates', dto),

  updateTemplate: (id: string, dto: Partial<CreateTemplateDto>) =>
    patch<NotificationTemplate>(`/notifications/templates/${id}`, dto),

  toggleTemplate: (id: string, isActive: boolean) =>
    patch<NotificationTemplate>(`/notifications/templates/${id}/toggle`, { isActive }),

  // Logs
  getLogs: (filters?: LogsFilters) =>
    get<PagedResponse<NotificationLog>>('/notifications/logs', { params: cleanParams(filters ?? {}) }),

  getStats: () => get<NotificationStats>('/notifications/stats'),

  getQueue: () => get<{ data: QueueJob[]; total: number }>('/notifications/queue'),

  getTemplateVariables: () =>
    get<Record<string, { name: string; description: string }[]>>('/notifications/template-variables'),

  previewTemplate: (payload: {
    event: string;
    channel: string;
    body: string;
    subject?: string;
    variables?: Record<string, string>;
  }) => post<{ subject?: string; body: string }>('/notifications/preview', payload),

  sendTest: (payload: {
    channel: NotificationChannel;
    templateKey: string;
    recipient: string;
    variables?: Record<string, string>;
  }) => post<{ success: boolean; message: string }>('/notifications/test', payload),

  retryLog: (logId: string) =>
    post<{ success: boolean; message: string }>(`/notifications/logs/${logId}/retry`, {}),

  getInbox: (filters?: { page?: number; pageSize?: number; unreadOnly?: boolean }) =>
    get<{ data: StaffNotification[]; total: number; unreadCount: number }>(
      '/notifications/inbox',
      { params: cleanParams(filters ?? {}) },
    ),

  markInboxRead: (id: string) =>
    patch<StaffNotification>(`/notifications/inbox/${id}/read`, {}),

  markAllInboxRead: () =>
    post<{ updated: number }>('/notifications/inbox/read-all', {}),

  // WhatsApp Evolution API
  getWhatsAppStatus: () => get<{
    isReady: boolean;
    state: string;
    qrCode: string | null;
    instance: string;
    webhookUrl: string;
    configured: boolean;
  }>('/notifications/whatsapp/status'),

  getWhatsAppQr: () => get<{ qrCode: string | null; state: string; webhookUrl: string }>(
    '/notifications/whatsapp/qr',
  ),

  connectWhatsApp: () => post<{
    isReady: boolean;
    state: string;
    qrCode: string | null;
    instance: string;
    webhookUrl: string;
    configured: boolean;
  }>('/notifications/whatsapp/connect', {}),

  configureWhatsAppWebhook: () => post<{ success: boolean; url: string; message?: string }>(
    '/notifications/whatsapp/configure-webhook',
    {},
  ),
};
