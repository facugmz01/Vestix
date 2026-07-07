import { get, post, patch, del, apiClient } from './client';
import type {
  LabelTemplate,
  CreateLabelTemplateDto,
  UpdateLabelTemplateDto,
} from '@/features/labels/types/label.types';

export const labelsApi = {
  getTemplates: () => get<LabelTemplate[]>('/labels/templates'),

  getTemplate: (id: string) => get<LabelTemplate>(`/labels/templates/${id}`),

  getDefaultTemplate: () => get<LabelTemplate>('/labels/templates/default'),

  createTemplate: (dto: CreateLabelTemplateDto) =>
    post<LabelTemplate>('/labels/templates', dto),

  updateTemplate: (id: string, dto: UpdateLabelTemplateDto) =>
    patch<LabelTemplate>(`/labels/templates/${id}`, dto),

  deleteTemplate: (id: string) => del(`/labels/templates/${id}`),

  duplicateTemplate: (id: string) =>
    post<LabelTemplate>(`/labels/templates/${id}/duplicate`, {}),

  setDefaultTemplate: (id: string) =>
    patch<LabelTemplate>(`/labels/templates/${id}/set-default`, {}),

  printVariant: async (variantId: string, quantity: number, templateId?: string) => {
    const { data } = await apiClient.post<Blob>(
      `/labels/print/variant/${variantId}`,
      { quantity, templateId },
      { responseType: 'blob' },
    );
    return data;
  },

  printBulk: async (
    items: { variantId: string; quantity: number }[],
    templateId?: string,
  ) => {
    const { data } = await apiClient.post<Blob>(
      '/labels/print',
      { items, templateId },
      { responseType: 'blob' },
    );
    return data;
  },
};
