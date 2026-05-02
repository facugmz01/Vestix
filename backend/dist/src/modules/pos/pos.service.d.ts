import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { IdentifiersService } from '../identifiers/identifiers.service';
import { PricingService } from '../pricing/pricing.service';
import { RulesEngineService } from '../pricing/rules-engine.service';
export declare class PosService {
    private readonly checkoutOrchestrator;
    private readonly identifiersService;
    private readonly pricingService;
    private readonly rulesEngine;
    constructor(checkoutOrchestrator: CheckoutOrchestrator, identifiersService: IdentifiersService, pricingService: PricingService, rulesEngine: RulesEngineService);
    resolveBarcode(barcode: string): Promise<{
        variantId: string;
        categoryId: string;
        sku: string;
        name: string;
        basePrice: number;
    }>;
    processQuickSale(payload: {
        branchId: string;
        warehouseId: string;
        variantId: string;
        categoryId: string;
        accountId: string;
    }): Promise<{
        status: string;
        order: {
            id: string;
            branchId: string;
            source: string;
            customerId: string | null;
            subtotal: number;
            cartDiscountTotal: number;
            grandTotal: number;
            appliedPromotions: import(".prisma/client").Prisma.JsonValue;
            paymentMethod: string;
            paymentAccountId: string | null;
            createdAt: Date;
            syncedAt: Date;
        };
    }>;
    calculateCart(dto: {
        lines: {
            variantId: string;
            quantity: number;
            discountPct?: number;
        }[];
        cartDiscountPct?: number;
        customerId?: string;
    }): Promise<{
        subtotal: number;
        lineDiscountsTotal: number;
        cartDiscountTotal: number;
        grandTotal: number;
        lines: {
            variantId: any;
            originalPrice: any;
            finalPrice: any;
        }[];
    }>;
}
