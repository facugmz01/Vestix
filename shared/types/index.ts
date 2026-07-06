export interface CreateSaleLineDto {
  variantId: string;
  categoryId?: string;
  quantity: number;
  discountPct?: number;
  unitPriceOverride?: number;
}

export interface SharedCreateSaleDto {
  id: string;
  branchId: string;
  warehouseId?: string;
  source: 'POS' | 'ECOMMERCE' | 'BACKOFFICE';
  customerId?: string;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'CUSTOMER_CREDIT' | 'BANK_TRANSFER' | 'MULTIPLE' | 'QR_MERCADOPAGO';
  paymentAccountId?: string;
  paymentReference?: string;
  payments?: { method: string; amount: number; reference?: string }[];
  status?: string;
  createdAtIso?: string;
  posGrandTotal?: number;
  cartDiscountTotal?: number;
  wasReserved?: boolean;
  cashShiftId?: string;
  issueInvoice?: boolean;
  lines: CreateSaleLineDto[];
}

export interface SyncQueueItem {
  id?: number; // Auto-incremented local ID
  type: 'SALE' | 'SALE_RETURN' | 'OTHER';
  payload: any; // The JSON payload to send to the backend
  createdAt: string; // ISO date
  status: 'PENDING' | 'ERROR';
  retryCount: number;
  lastError?: string;
}
