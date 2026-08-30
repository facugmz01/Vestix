import { get, post } from './client';
import type { CashRegister, ProductVariant } from '@/types';

export interface OpenSessionDto {
  cashRegisterId: string;
  openingAmount: number;
}

export interface CloseSessionDto {
  closingAmount: number;
  notes?: string;
}

export interface POSCalculateDto {
  lines: { variantId: string; quantity: number; discountPct?: number }[];
  cartDiscountPct?: number;
  customerId?: string;
}

export interface POSCalculateResponse {
  subtotal: number;
  lineDiscountsTotal: number;
  cartDiscountTotal: number;
  grandTotal: number;
  appliedPromotions?: string[];
  lines: {
    variantId: string;
    originalPrice: number;
    finalPrice: number;
  }[];
}

export interface PosShiftOrder {
  id: string;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customerName: string;
}

export interface PosSearchProductOptions {
  customerId?: string;
  branchId?: string;
  priceListId?: string;
  categoryId?: string;
  brandId?: string;
}

export interface PriceCheckStockWarehouse {
  warehouseId: string;
  warehouseName: string;
  branchId?: string;
  branchName?: string;
  availableQuantity: number;
  physicalQuantity: number;
  reservedQuantity: number;
}

export interface PriceCheckVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  barcodes: string[];
  size?: string | null;
  color?: string | null;
  attributes?: Record<string, string>;
  costPrice: number;
  basePrice: number;
  overridePrice: number | null;
  effectivePrice: number;
  imageUrl?: string | null;
  isScannedMatch?: boolean;
  stock: {
    available: number;
    physical: number;
    reserved: number;
    byWarehouse: PriceCheckStockWarehouse[];
  };
}

export interface PriceCheckResponse {
  query: string;
  found: boolean;
  product: {
    id: string;
    name: string;
    baseSku: string | null;
    description: string | null;
    type: string;
    images: string[];
    category: { id: string; name: string } | null;
    brand: { id: string; name: string } | null;
    costPrice: number;
    isActive: boolean;
  };
  matchedVariant: PriceCheckVariant;
  variants: PriceCheckVariant[];
  pricingSummary: {
    minPrice: number;
    maxPrice: number;
    currency: string;
    priceListName: string;
    priceListId?: string;
    vatDefaultPct: number;
    showPricesWithTax: boolean;
  };
  stockSummary: {
    totalAvailable: number;
    totalPhysical: number;
    warehousesCount: number;
  };
}

export const posApi = {
  // Session Management
  getMyRegister: () => get<CashRegister | null>('/pos/session/current'),
  
  getAvailableRegisters: (branchId: string) => 
    get<CashRegister[]>('/pos/registers', { params: { branchId } }),

  openSession: (dto: OpenSessionDto) =>
    post<CashRegister>('/pos/session/open', dto),

  closeSession: (dto: CloseSessionDto) =>
    post<{ success: boolean }>('/pos/session/close', dto),

  // Scanner / Product Lookup & Price Checker
  searchProduct: (
    query: string,
    customerIdOrOptions?: string | PosSearchProductOptions,
    options?: PosSearchProductOptions,
  ) => {
    let customerId: string | undefined;
    let branchId: string | undefined;
    let priceListId: string | undefined;
    let categoryId: string | undefined;
    let brandId: string | undefined;

    if (typeof customerIdOrOptions === 'object' && customerIdOrOptions !== null) {
      customerId = customerIdOrOptions.customerId;
      branchId = customerIdOrOptions.branchId;
      priceListId = customerIdOrOptions.priceListId;
      categoryId = customerIdOrOptions.categoryId;
      brandId = customerIdOrOptions.brandId;
    } else {
      customerId = customerIdOrOptions;
      branchId = options?.branchId;
      priceListId = options?.priceListId;
      categoryId = options?.categoryId;
      brandId = options?.brandId;
    }

    return get<any[]>('/pos/catalog/search', {
      params: {
        q: query,
        customerId: customerId || undefined,
        branchId: branchId || undefined,
        priceListId: priceListId || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
      },
    });
  },

  priceCheck: (
    code: string,
    options?: { branchId?: string; priceListId?: string; customerId?: string },
  ) =>
    get<any>('/pos/price-check', {
      params: {
        code,
        branchId: options?.branchId || undefined,
        priceListId: options?.priceListId || undefined,
        customerId: options?.customerId || undefined,
      },
    }),

  // Delegate complex promotion calculations to backend
  calculateCart: (dto: POSCalculateDto) =>
    post<POSCalculateResponse>('/pos/cart/calculate', dto),

  generateQrOrder: (amount: number, title: string = 'Cobro POS') =>
    post<{ orderId: string; qrData: string }>('/pos/qr-order', { amount, title }),

  getQrOrderStatus: (orderId: string) =>
    get<{ orderId: string; status: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED'; amount: number }>(
      `/pos/qr-order/${orderId}/status`,
    ),

  getShiftOrders: (shiftId: string) =>
    get<PosShiftOrder[]>(`/pos/shift/${shiftId}/orders`),
};
