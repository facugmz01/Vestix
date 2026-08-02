import { get, post, put, patch, apiClient } from './client';

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
  saleChannels: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  purchaseChannels: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  deliveryChannels: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  lowStockChannels: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  transferChannels: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
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
  mpPublicKey?: string;
  mpAccessToken?: string;
  mpWebhookSecret?: string;
  mpEnvironment?: 'test' | 'production';
  mpExternalPosId?: string;
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

import type { ReceiptStyleSettings } from '@/features/receipts/types/receiptStyle.types';

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
  receiptStyle?: ReceiptStyleSettings;
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
  transferAlias?: string;
  transferHolderName?: string;
  transferBankName?: string;
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
  storeLoginChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
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

export interface GiftCardTemplateSettings {
  brandLabel: string;
  title: string;
  subtitle?: string;
  backgroundColor: string;
  backgroundGradientEnd: string;
  useGradient: boolean;
  textColor: string;
  accentColor: string;
  cardWidthMm: number;
  cardHeightMm: number;
  borderRadiusPx: number;
  fontFamily: 'sans-serif' | 'serif' | 'monospace';
  amountFontSizePx: number;
  showLogo: boolean;
  logoUrl?: string;
  showQr: boolean;
  qrSizePx: number;
  showRecipient: boolean;
  showExpiry: boolean;
  showCode: boolean;
  footerText: string;
  paperMarginMm: number;
}

export interface GiftCardsSettings {
  template: GiftCardTemplateSettings;
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
  giftCards:    GiftCardsSettings;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  logs?: string[];
}

export interface GenerateArcaCsrResult {
  certAlias: string;
  keyFile: string;
  csrFile: string;
}

export interface UploadArcaCertResult {
  certAlias: string;
  certFile: string;
}

export const settingsApi = {
  getSettings: () =>
    get<SystemSettings>('/settings'),

  patchSection: (section: string, dto: any) =>
    patch<SystemSettings>(`/settings/${section}`, dto),

  putSettings: (dto: Partial<SystemSettings>) =>
    put<SystemSettings>('/settings', dto),

  testAfip: () => 
    post<ConnectionTestResult>('/settings/invoicing/test-afip', {}),
  
  testSmtp: (data: any) => 
    post<ConnectionTestResult>('/settings/notifications/test-smtp', data),
    
  testSms: (data: any) => 
    post<ConnectionTestResult>('/settings/notifications/test-sms', data),
    
  testWhatsapp: (data: any) => 
    post<ConnectionTestResult>('/settings/notifications/test-whatsapp', data),

  testPush: (data: any) => 
    post<ConnectionTestResult>('/settings/notifications/test-push', data),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return post<{ logoUrl: string }>('/settings/general/logo', fd as any);
  },

  generateArcaCsr: (data: { certAlias: string; cuit: string; organizationName?: string }) =>
    post<GenerateArcaCsrResult>('/settings/arca/generate-csr', data),

  uploadArcaCert: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return post<UploadArcaCertResult>('/settings/arca/upload-cert', fd as any);
  },

  downloadArcaCsr: async (filename: string) => {
    const { data } = await apiClient.get<Blob>('/settings/arca/download-csr', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  repriceUsd: (type: 'Oficial' | 'Blue') =>
    post<{ success: boolean; updatedCount: number }>('/catalog/reprice-usd', { type }),
};
