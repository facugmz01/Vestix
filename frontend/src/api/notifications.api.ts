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
  event: NotificationEvent;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  isActive: boolean;
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

  // WhatsApp OpenWA
  getWhatsAppStatus: () => get<{ isReady: boolean; qrCode: string | null }>('/notifications/whatsapp/status'),
};
