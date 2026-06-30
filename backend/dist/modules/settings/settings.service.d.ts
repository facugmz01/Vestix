import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../../core/crypto/encryption.service';
import { UpdateSettingsDto } from './dto/settings.dto';
export interface GeneralSettings {
    companyName: string;
    legalName: string;
    taxId: string;
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
    usdOfficialRate?: number;
    usdBlueRate?: number;
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
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    evolutionInstance?: string;
    fcmServerKey?: string;
}
export interface StorefrontSettings {
    enabled: boolean;
    primaryColor: string;
    fontFamily: string;
    showHeader: boolean;
    showStoreName: boolean;
    imagesCarousel: any[];
    priceListToShow: string;
    defaultSort: string;
    hideOutOfStock: boolean;
    hideBrandFilters: boolean;
    transferCbu?: string;
    acceptCash: boolean;
    shippingInfo: string;
    requireShippingData: string;
    whatsapp: string;
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
    youtubeUrl: string;
    xUrl: string;
    subdomain?: string;
    allowedPaymentMethods?: string[];
    shippingMethods?: any[];
}
export interface IntegrationSettings {
    mercadopagoEnabled: boolean;
    mercadolibreEnabled: boolean;
    woocommerceEnabled: boolean;
    shopifyEnabled: boolean;
    mpPublicKey?: string;
    mpAccessToken?: string;
    mpWebhookSecret?: string;
    mlAppId?: string;
    mlSecretKey?: string;
    shopifyStoreUrl?: string;
    shopifyAccessToken?: string;
    wooStoreUrl?: string;
    wooConsumerKey?: string;
    wooConsumerSecret?: string;
}
export interface PwaSettings {
    appName: string;
    appShortName: string;
    themeColor: string;
    backgroundColor: string;
    iconUrl: string;
}
export interface SkuBarcodeSettings {
    skuPrefix: string;
    skuAutoGenerate: boolean;
    barcodeFormat: string;
    barcodeAutoGenerate: boolean;
    nextSkuSequence: number;
}
export interface ArcaSettings {
    enabled: boolean;
    pointOfSale: string | number;
    environment: string;
    startDate: string;
    iibb: string;
    cuit: string;
    certAlias: string;
}
export interface OfflineSettings {
    offlineModeEnabled: boolean;
    posOfflineTtlHours: number;
    maxQueueSize: number;
    autoSyncOnReconnect: boolean;
    conflictStrategy: string;
}
export declare class SettingsService implements OnModuleInit {
    private readonly prisma;
    private readonly auditService;
    private readonly encryption;
    private readonly logger;
    private cache;
    constructor(prisma: PrismaService, auditService: AuditService, encryption: EncryptionService);
    onModuleInit(): Promise<void>;
    private sanitizeSection;
    private stripMaskedFields;
    private encryptSection;
    private decryptSection;
    private maskSection;
    private decryptRow;
    private maskForResponse;
    private invalidateCache;
    private getCachedRaw;
    getGeneralSettings(): Promise<GeneralSettings>;
    getPricingSettings(): Promise<PricingSettings>;
    getPosSettings(): Promise<PosSettings>;
    getNotificationSettings(): Promise<NotificationSettings>;
    getStorefrontSettings(): Promise<StorefrontSettings>;
    getIntegrationSettings(): Promise<IntegrationSettings>;
    getPwaSettings(): Promise<PwaSettings>;
    getSkuBarcodeSettings(): Promise<SkuBarcodeSettings>;
    getArcaSettings(): Promise<ArcaSettings>;
    getOfflineSettings(): Promise<OfflineSettings>;
    getSettings(): Promise<any>;
    updateSection(section: string, dto: Record<string, any>, userId: string): Promise<any>;
    updateAllSettings(dto: UpdateSettingsDto, userId: string): Promise<any>;
    private syncGeneralToBranch;
    testAfipConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    testSmtpConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    testSmsConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    testWhatsappConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    testPushConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    repriceUsd(usdType: 'Oficial' | 'Blue'): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    private ensureDefaultSettings;
}
