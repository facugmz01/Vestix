import { get, post, put } from './client';

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
  storefrontUrl?: string;   // URL pública del e-commerce
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
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smsGatewayUrl?: string;
  openWaUrl?: string;
  openWaSession?: string;
  fcmServerKey?: string;
}

export interface IntegrationSettings {
  mercadopagoEnabled: boolean;
  mercadolibreEnabled: boolean;
  woocommerceEnabled: boolean;
  shopifyEnabled: boolean;
  mlAppId?: string;
  mlSecretKey?: string;
  shopifyStoreUrl?: string;
  shopifyAccessToken?: string;
  wooStoreUrl?: string;
  wooConsumerKey?: string;
  wooConsumerSecret?: string;
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

  putSettings: (dto: Partial<SystemSettings>) =>
    put<SystemSettings>('/settings', dto),

  testAfip: () => 
    post<{success: boolean; message: string}>('/settings/invoicing/test-afip', {}),
  
  testSmtp: (data: any) => 
    post<{success: boolean; message: string}>('/settings/notifications/test-smtp', data),
    
  testSms: (data: any) => 
    post<{success: boolean; message: string}>('/settings/notifications/test-sms', data),
    
  testWhatsapp: (data: any) => 
    post<{success: boolean; message: string}>('/settings/notifications/test-whatsapp', data),

  testPush: (data: any) => 
    post<{success: boolean; message: string}>('/settings/notifications/test-push', data),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return post<{ logoUrl: string }>('/settings/general/logo', fd as any);
  },
};
