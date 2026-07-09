import type { SaleOrder } from '@/types';
import { DEFAULT_RECEIPT_STYLE } from '@/features/receipts/types/receiptStyle.types';

export const RECEIPT_PREVIEW_ORDER: SaleOrder = {
  id: '00000000-0000-4000-8000-000000000001',
  branchId: 'preview',
  source: 'POS',
  status: 'COMPLETED',
  customerName: 'María López',
  subtotal: 45000,
  cartDiscountTotal: 2000,
  grandTotal: 43000,
  paymentMethod: 'CASH',
  createdAt: new Date().toISOString(),
  lines: [
    {
      id: 'line-1',
      variantId: 'variant-1',
      productName: 'Remera Básica',
      variantSku: 'REM-BLA-M',
      quantity: 2,
      basePrice: 15000,
      discountAmount: 0,
      finalPrice: 30000,
      variant: { product: { name: 'Remera Básica' }, sku: 'REM-BLA-M', size: 'M' } as any,
    },
    {
      id: 'line-2',
      variantId: 'variant-2',
      productName: 'Jean Slim',
      variantSku: 'JEA-AZU-38',
      quantity: 1,
      basePrice: 15000,
      discountAmount: 0,
      finalPrice: 15000,
      variant: { product: { name: 'Jean Slim' }, sku: 'JEA-AZU-38', size: '38' } as any,
    },
  ],
};

export const RECEIPT_PREVIEW_BRANCH = {
  posReceiptHeader: 'RO Indumentaria\nAv. Corrientes 1234',
  posReceiptFooter: 'Gracias por tu compra\nInstagram: @roindumentaria',
};

export const RECEIPT_PREVIEW_STYLE = DEFAULT_RECEIPT_STYLE;
