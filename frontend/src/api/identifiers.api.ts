import { post } from './client';
import { labelsApi } from './labels.api';

export const identifiersApi = {
  generateSku: (productId?: string, attributes?: string[] | Record<string, string>) =>
    post<{ sku: string }>('/identifiers/generate-sku', { productId, attributes }),

  /** Sequential base SKU from settings (prefix + nextSkuSequence). */
  generateBaseSku: () =>
    post<{ sku: string }>('/identifiers/generate-sku', { base: true }),

  generateBarcode: () =>
    post<{ barcode: string }>('/identifiers/generate-barcode', {}),

  printLabels: (variantId: string, quantity: number, templateId?: string) =>
    labelsApi.printVariant(variantId, quantity, templateId),
};
