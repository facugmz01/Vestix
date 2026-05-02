import { PriceList, PriceListEntry } from './models/price-list.model';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { RulesEngineService } from './rules-engine.service';
export declare class PricingService {
    private readonly rulesEngine;
    constructor(rulesEngine: RulesEngineService);
    private priceLists;
    private entries;
    private customerPriceListAssignments;
    findAll(): Promise<PriceList[]>;
    findOne(id: string): Promise<PriceList>;
    createPriceList(dto: CreatePriceListDto): Promise<PriceList>;
    setVariantPrice(priceListId: string, variantId: string, overridePrice: number): Promise<PriceListEntry>;
    assignCustomerToPriceList(customerId: string, priceListId: string): Promise<{
        success: boolean;
    }>;
    resolvePrice(variantId: string, basePrice: number, customerId?: string): Promise<number>;
    calculateMargin(sellingPrice: number, weightedAverageCost: number): {
        marginPercent: number;
        markupPercent: number;
        grossProfit: number;
    };
    bulkUpdateVariantPrices(priceListId: string, variantsData: {
        variantId: string;
        basePrice: number;
    }[], modifierPercentage: number): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
}
