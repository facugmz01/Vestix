export declare enum PriceListType {
    RETAIL = "RETAIL",
    WHOLESALE = "WHOLESALE",
    VIP = "VIP",
    PROMOTIONAL = "PROMOTIONAL"
}
export interface PriceList {
    id: string;
    name: string;
    type: PriceListType;
    isActive: boolean;
    currency: string;
    isPercentageBased: boolean;
    percentageDiscount?: number;
    validFrom?: Date;
    validTo?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface PriceListEntry {
    id: string;
    priceListId: string;
    variantId: string;
    overridePrice: number;
    updatedAt: Date;
}
