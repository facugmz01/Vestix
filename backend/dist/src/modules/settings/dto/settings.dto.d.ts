export declare class GeneralSettingsDto {
    companyName?: string;
    taxId?: string;
    legalName?: string;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    storefrontUrl?: string;
    logoUrl?: string;
    timezone?: string;
    locale?: string;
    currency?: string;
}
export declare class PricingSettingsDto {
    defaultPriceListId?: string;
    vatDefaultPct?: number;
    allowManualDiscount?: boolean;
    maxDiscountPct?: number;
    roundingRule?: 'NONE' | 'NEAREST_10' | 'UP' | 'DOWN';
    showPricesWithTax?: boolean;
}
export declare class SkuBarcodeSettingsDto {
    skuPrefix?: string;
    skuAutoGenerate?: boolean;
    barcodeFormat?: 'EAN13' | 'CODE128' | 'QR' | 'NONE';
    barcodeAutoGenerate?: boolean;
    nextSkuSequence?: number;
}
export declare class InvoicingSettingsDto {
    fiscalPointSale?: number;
    afipEnvironment?: 'homologation' | 'production';
    defaultInvoiceType?: 'FACTURA_B' | 'FACTURA_A' | 'FACTURA_C';
    autoIssueOnSale?: boolean;
    invoiceFooterText?: string;
}
export declare class NotificationSettingsDto {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    whatsappEnabled?: boolean;
    pushEnabled?: boolean;
    lowStockThreshold?: number;
    notifyOnSale?: boolean;
    notifyOnPurchase?: boolean;
    notifyOnLowStock?: boolean;
    notifyOnTransfer?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smsGatewayUrl?: string;
    openWaUrl?: string;
    openWaSession?: string;
    fcmServerKey?: string;
}
export declare class IntegrationSettingsDto {
    mercadopagoEnabled?: boolean;
    mercadolibreEnabled?: boolean;
    woocommerceEnabled?: boolean;
    shopifyEnabled?: boolean;
    mlAppId?: string;
    mlSecretKey?: string;
    shopifyStoreUrl?: string;
    shopifyAccessToken?: string;
    wooStoreUrl?: string;
    wooConsumerKey?: string;
    wooConsumerSecret?: string;
}
export declare class OfflineSettingsDto {
    offlineModeEnabled?: boolean;
    posOfflineTtlHours?: number;
    maxQueueSize?: number;
    autoSyncOnReconnect?: boolean;
    conflictStrategy?: 'ASK_USER' | 'SERVER_WINS' | 'CLIENT_WINS';
}
export declare class UpdateSettingsDto {
    general?: GeneralSettingsDto;
    pricing?: PricingSettingsDto;
    skuBarcode?: SkuBarcodeSettingsDto;
    invoicing?: InvoicingSettingsDto;
    notifications?: NotificationSettingsDto;
    integrations?: IntegrationSettingsDto;
    offline?: OfflineSettingsDto;
}
