export interface SystemSettings {
    version: number;
    store: {
        name: string;
        legalName: string;
        cuit: string;
        currency: string;
        timezone: string;
        logoUrl?: string;
    };
    sku: {
        prefix: string;
        includeCategory: boolean;
        includeBrand: boolean;
        includeColor: boolean;
        includeSize: boolean;
        separator: string;
        uppercased: boolean;
    };
    barcode: {
        companyPrefix: string;
        autoGenerate: boolean;
    };
    pricing: {
        defaultVatRate: number;
        defaultMarginTarget: number;
        allowNegativeMargin: boolean;
        roundToNearest: number;
        defaultRetailPriceListId: string;
        defaultWholesalePriceListId?: string;
    };
    inventory: {
        allowNegativeStock: boolean;
        defaultReorderPoint: number;
        reservationTtlMinutes: number;
    };
    offline: {
        maxOfflineHours: number;
        requireManagerPinForReturns: boolean;
        requireManagerPinForDiscounts: boolean;
    };
    notifications: {
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
    };
    integrations: {
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
    };
    updatedAt: Date;
    updatedByUserId: string;
}
