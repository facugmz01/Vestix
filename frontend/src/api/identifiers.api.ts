import { post } from './client';
import { labelsApi } from './labels.api';

export const identifiersApi = {
  generateSku: (productId?: string, attributes?: string[]) =>
    post<{ sku: string }>('/identifiers/generate-sku', { productId, attributes }),

  generateBarcode: () =>
    post<{ barcode: string }>('/identifiers/generate-barcode', {}),

  printLabels: (variantId: string, quantity: number, templateId?: string) =>
    labelsApi.printVariant(variantId, quantity, templateId),
};
