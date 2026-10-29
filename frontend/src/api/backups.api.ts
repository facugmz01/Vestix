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

  remove: (id: string, force = false) =>
    del<{ success: boolean }>(`/backups/${id}${force ? '?force=true' : ''}`),

  download: async (id: string, filename: string) => {
    try {
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown } };
      if (axiosErr?.response?.data instanceof Blob) {
        try {
          const text = await axiosErr.response.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || 'Error al descargar el backup');
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== 'Error al descargar el backup') {
            throw parseErr;
          }
        }
      }
      throw err;
    }
  },
};
