import { apiClient } from './client';

export interface FailedJob {
  id: string;
  name: string;
  data: any;
  failedReason: string;
  attemptsMade: number;
  failedAt: string;
}

export const afipApi = {
  getFailedJobs: () => apiClient.get<FailedJob[]>('/afip/failed-jobs').then(res => res.data),
  retryJob: (id: string) => apiClient.post<{ success: boolean; message: string }>(`/afip/retry-job/${id}`).then(res => res.data),
};
