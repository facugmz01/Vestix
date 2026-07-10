import { get, post, del, apiClient } from './client';
import { cleanParams } from './requestUtils';
import type { BackupJob, PagedResponse } from '@/types';

export interface BackupFilters {
  page?: number;
  pageSize?: number;
}

export const backupsApi = {
  list: (filters?: BackupFilters) =>
    get<PagedResponse<BackupJob>>('/backups', { params: cleanParams(filters ?? {}) }),

  get: (id: string) =>
    get<BackupJob>(`/backups/${id}`),

  create: (description?: string) =>
    post<BackupJob>('/backups', { description }),

  restore: (id: string) =>
    post<BackupJob>(`/backups/${id}/restore`, { confirm: true }),

  remove: (id: string) =>
    del<{ success: boolean }>(`/backups/${id}`),

  download: async (id: string, filename: string) => {
    const { data } = await apiClient.get<Blob>(`/backups/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
