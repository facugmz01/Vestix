import { PrismaService } from '../../core/prisma/prisma.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { RulesEngineService } from './rules-engine.service';
export declare class PricingService {
    private readonly rulesEngine;
    private readonly prisma;
    constructor(rulesEngine: RulesEngineService, prisma: PrismaService);
    findAll(): Promise<({
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
        code: string;
        type: string;
        modifierPercentage: number;
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
        code: string;
        type: string;
        modifierPercentage: number;
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
    createPriceList(dto: CreatePriceListDto): Promise<{
        id: string;
        name: string;
        code: string;
        type: string;
        modifierPercentage: number;
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
    setVariantPrice(priceListId: string, variantId: string, overridePrice: number): Promise<{
        id: string;
        priceListId: string;
        variantId: string;
        overridePrice: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    resolvePrice(variantId: string, basePrice: number, customerId?: string): Promise<number>;
    resolvePriceListPrice(variantId: string, basePrice: number, priceListId: string): Promise<number>;
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
