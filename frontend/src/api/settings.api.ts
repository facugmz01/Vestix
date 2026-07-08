import { get, post, put, patch } from './client';

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
  defaultInvoiceType: 'FACTURA_B' | 'FACTURA_A' | 'FACTURA_C' | 'EXENTO';
  autoIssueOnSale: boolean;
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
  notifyOnDelivery: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smsGatewayUrl?: string;
  // Evolution API (WhatsApp)
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
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

export interface PosSettings {
  allowNegativeStock: boolean;
  thermalPrint80mm: boolean;
  fiscalPrint70mm: boolean;
  boxMode: string;
  defaultPriceType: string;
  requireInternalCode: boolean;
  requireBarcode: boolean;
  requireBrand: boolean;
  requireDescription: boolean;
  requireShippingDimensions: boolean;
  officialDollarQuote: number;
  blueDollarQuote: number;
}

export interface ArcaSettings {
  enabled: boolean;
  pointOfSale: number;
  environment: 'homologation' | 'production';
  startDate: string;
  iibb: string;
  cuit: string;
  certAlias: string;
}

export interface StorefrontSettings {
  enabled: boolean;
  primaryColor: string;
  fontFamily: string;
  showHeader: boolean;
  storeName?: string;
  showStoreName: boolean;
  imagesCarousel: any[];
  priceListToShow: string;
  defaultSort: string;
  hideOutOfStock: boolean;
  hideBrandFilters?: boolean;
  transferCbu?: string;
  acceptCash: boolean;
  shippingInfo: string;
  requireShippingData: 'optional' | 'required' | 'none';
  whatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  xUrl: string;
  subdomain?: string;
  allowedPaymentMethods?: string[];
  shippingMethods?: Array<{ id: string; name: string; price: number; type: 'SHIPPING' | 'PICKUP' }>;
  deliverySettings?: {
    enableGpsTracking: boolean;
    enableGeofence: boolean;
    geofenceRadiusMeters: number;
    requirePhotoOnDelivery: boolean;
    showMapToCustomer: boolean;
    carriers?: {
      andreani?: { enabled: boolean; apiKey?: string; clientId?: string; contract?: string };
      mercadoEnvios?: { enabled: boolean; accessToken?: string; userId?: string };
    };
  };
}

export interface PwaSettings {
  appName: string;
  appShortName: string;
  themeColor: string;
  backgroundColor: string;
  iconUrl: string;
}

export interface QrSettings {
  mpStoreName: string;
  qrGenerated: boolean;
}

export interface LabelPrintingSettings {
  defaultTemplateId?: string;
  autoGenerateBarcodeOnPrint: boolean;
  defaultOutput: 'PDF' | 'ZPL' | 'BROWSER';
  zplDpi: 203 | 300;
  zplPrinterHost?: string;
  zplPrinterPort?: number;
}

export interface SystemSettings {
  general:      GeneralSettings;
  pricing:      PricingSettings;
  skuBarcode:   SkuBarcodeSettings;
  invoicing:    InvoicingSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  offline:      OfflineSettings;
  pos:          PosSettings;
  arca:         ArcaSettings;
  storefront:   StorefrontSettings;
  pwa:          PwaSettings;
  qr:           QrSettings;
  labelPrinting: LabelPrintingSettings;
}

export const settingsApi = {
  getSettings: () =>
    get<SystemSettings>('/settings'),

  patchSection: (section: string, dto: any) =>
    patch<SystemSettings>(`/settings/${section}`, dto),

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

  repriceUsd: (type: 'Oficial' | 'Blue') =>
    post<{ success: boolean; updatedCount: number }>('/catalog/reprice-usd', { type }),
};
