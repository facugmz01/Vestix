import { get, patch, post } from './client';

// ─── Typed settings sections ─────────────────────────────────────────────────

export interface GeneralSettings {
  companyName: string;
  taxId: string;             // CUIT
  legalName: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  timezone: string;
  locale: string;
  currency: string;
}

export interface PricingSettings {
  defaultPriceListId: string;
  vatDefaultPct: number;
  allowManualDiscount: boolean;
  maxDiscountPct: number;
  roundingRule: 'NONE' | 'NEAREST_10' | 'UP' | 'DOWN';
  showPricesWithTax: boolean;
}

export interface SkuBarcodeSettings {
  skuPrefix: string;
  skuAutoGenerate: boolean;
  barcodeFormat: 'EAN13' | 'CODE128' | 'QR' | 'NONE';
  barcodeAutoGenerate: boolean;
  nextSkuSequence: number;
}

export interface InvoicingSettings {
  fiscalPointSale: number;     // Punto de venta AFIP
  afipEnvironment: 'homologation' | 'production';
  defaultInvoiceType: 'FACTURA_B' | 'FACTURA_A' | 'FACTURA_C';
  autoIssueOnSale: boolean;
  invoiceFooterText?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  lowStockThreshold: number;
  notifyOnSale: boolean;
  notifyOnPurchase: boolean;
  notifyOnLowStock: boolean;
  notifyOnTransfer: boolean;
}

export interface IntegrationSettings {
  mercadopagoEnabled: boolean;
  mercadolibreEnabled: boolean;
  woocommerceEnabled: boolean;
  shopifyEnabled: boolean;
}

export interface OfflineSettings {
  offlineModeEnabled: boolean;
  posOfflineTtlHours: number;
  maxQueueSize: number;
  autoSyncOnReconnect: boolean;
  conflictStrategy: 'ASK_USER' | 'SERVER_WINS' | 'CLIENT_WINS';
}

export interface SystemSettings {
  general:      GeneralSettings;
  pricing:      PricingSettings;
  skuBarcode:   SkuBarcodeSettings;
  invoicing:    InvoicingSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  offline:      OfflineSettings;
}

export const settingsApi = {
  getSettings: () =>
    get<SystemSettings>('/settings'),

  updateGeneral: (dto: Partial<GeneralSettings>) =>
    patch<GeneralSettings>('/settings/general', dto),

  updatePricing: (dto: Partial<PricingSettings>) =>
    patch<PricingSettings>('/settings/pricing', dto),

  updateSkuBarcode: (dto: Partial<SkuBarcodeSettings>) =>
    patch<SkuBarcodeSettings>('/settings/sku-barcode', dto),

  updateInvoicing: (dto: Partial<InvoicingSettings>) =>
    patch<InvoicingSettings>('/settings/invoicing', dto),

  updateNotifications: (dto: Partial<NotificationSettings>) =>
    patch<NotificationSettings>('/settings/notifications', dto),

  updateIntegrations: (dto: Partial<IntegrationSettings>) =>
    patch<IntegrationSettings>('/settings/integrations', dto),

  updateOffline: (dto: Partial<OfflineSettings>) =>
    patch<OfflineSettings>('/settings/offline', dto),

  testAfipConnection: () =>
    post<{ success: boolean; message: string }>('/settings/invoicing/test-afip', {}),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return post<{ logoUrl: string }>('/settings/general/logo', fd as any);
  },
};
