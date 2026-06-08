import { PriceListType } from '../models/price-list.model';
export declare class CreatePriceListDto {
    name: string;
    type?: PriceListType;
    currency?: string;
    margin?: number;
    isPercentageBased?: boolean;
    percentageDiscount?: number;
    validFrom?: string;
    validTo?: string;
    isDefault?: boolean;
}
