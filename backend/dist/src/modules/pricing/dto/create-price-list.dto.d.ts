import { PriceListType } from '../models/price-list.model';
export declare class CreatePriceListDto {
    name: string;
    type: PriceListType;
    currency: string;
    isPercentageBased?: boolean;
    percentageDiscount?: number;
    validFrom?: string;
    validTo?: string;
}
