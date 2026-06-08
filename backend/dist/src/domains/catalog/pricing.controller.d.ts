import { PricingService } from './pricing.service';
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    findAll(page: string, pageSize: string): Promise<({
        entries: {
            id: string;
            priceListId: string;
            variantId: string;
            overridePrice: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        type: string;
        currency: string;
        margin: number;
        isActive: boolean;
        isPercentageBased: boolean;
        percentageDiscount: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        entries: {
            id: string;
            priceListId: string;
            variantId: string;
            overridePrice: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        type: string;
        currency: string;
        margin: number;
        isActive: boolean;
        isPercentageBased: boolean;
        percentageDiscount: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
