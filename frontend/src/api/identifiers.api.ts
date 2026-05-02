import { post } from './client';

export const identifiersApi = {
  generateSku: (productId?: string, attributes?: string[]) =>
    post<{ sku: string }>('/identifiers/generate-sku', { productId, attributes }),

  generateBarcode: () =>
    post<{ barcode: string }>('/identifiers/generate-barcode', {}),

  printLabels: (variantId: string, quantity: number) =>
    post<Blob>(`/identifiers/labels/variant/${variantId}`, { quantity }, { responseType: 'blob' }), // Expects a PDF blob or similar
};
