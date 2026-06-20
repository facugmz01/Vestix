export declare class CreatePriceListDto {
    name: string;
    code: string;
    type?: any;
    currency?: string;
    margin?: number;
    isPercentageBased?: boolean;
    percentageDiscount?: number;
    modifierPercentage?: number;
    isActive?: boolean;
    validFrom?: string;
    validTo?: string;
    isDefault?: boolean;
}
