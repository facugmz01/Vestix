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
    updatedAt: Date;
    updatedByUserId: string;
}
