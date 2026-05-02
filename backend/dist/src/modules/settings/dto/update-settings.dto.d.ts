declare class StoreSettingsDto {
    name: string;
    legalName: string;
    cuit: string;
    currency: string;
    timezone: string;
    logoUrl?: string;
}
declare class SkuSettingsDto {
    prefix: string;
    includeCategory: boolean;
    includeBrand: boolean;
    includeColor: boolean;
    includeSize: boolean;
    separator: string;
    uppercased: boolean;
}
declare class BarcodeSettingsDto {
    companyPrefix: string;
    autoGenerate: boolean;
}
declare class PricingSettingsDto {
    defaultVatRate: number;
    defaultMarginTarget: number;
    allowNegativeMargin: boolean;
    roundToNearest: number;
    defaultRetailPriceListId: string;
    defaultWholesalePriceListId?: string;
}
declare class InventorySettingsDto {
    allowNegativeStock: boolean;
    defaultReorderPoint: number;
    reservationTtlMinutes: number;
}
declare class OfflineSettingsDto {
    maxOfflineHours: number;
    requireManagerPinForReturns: boolean;
    requireManagerPinForDiscounts: boolean;
}
export declare class UpdateSettingsDto {
    store?: StoreSettingsDto;
    sku?: SkuSettingsDto;
    barcode?: BarcodeSettingsDto;
    pricing?: PricingSettingsDto;
    inventory?: InventorySettingsDto;
    offline?: OfflineSettingsDto;
}
export {};
