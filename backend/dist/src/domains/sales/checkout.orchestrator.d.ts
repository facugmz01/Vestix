import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { AfipProducer } from '../invoicing/afip.producer';
import { InventoryService } from '../logistics/inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class CheckoutOrchestrator {
    private readonly prisma;
    private readonly pricingService;
    private readonly rulesEngine;
    private readonly afipProducer;
    private readonly inventoryService;
    constructor(prisma: PrismaService, pricingService: PricingService, rulesEngine: RulesEngineService, afipProducer: AfipProducer, inventoryService: InventoryService);
    processCheckout(dto: CreateOrderDto): Promise<{
        status: string;
        order: {
            id: string;
            branchId: string;
            warehouseId: string | null;
            source: string;
            customerId: string | null;
            subtotal: number;
            cartDiscountTotal: number;
            grandTotal: number;
            appliedPromotions: import(".prisma/client").Prisma.JsonValue;
            paymentMethod: string;
            paymentAccountId: string | null;
            status: string;
            cashShiftId: string | null;
            createdAt: Date;
            syncedAt: Date;
        };
    }>;
    confirmQuotation(id: string): Promise<{
        lines: {
            id: string;
            orderId: string;
            variantId: string;
            categoryId: string;
            quantity: number;
            basePrice: number;
            discountAmount: number;
            finalPrice: number;
            historicalSku: string | null;
            historicalName: string | null;
            historicalCost: number | null;
        }[];
    } & {
        id: string;
        branchId: string;
        warehouseId: string | null;
        source: string;
        customerId: string | null;
        subtotal: number;
        cartDiscountTotal: number;
        grandTotal: number;
        appliedPromotions: import(".prisma/client").Prisma.JsonValue;
        paymentMethod: string;
        paymentAccountId: string | null;
        status: string;
        cashShiftId: string | null;
        createdAt: Date;
        syncedAt: Date;
    }>;
    private deductStock;
    cancelOrder(id: string): Promise<{
        id: string;
        branchId: string;
        warehouseId: string | null;
        source: string;
        customerId: string | null;
        subtotal: number;
        cartDiscountTotal: number;
        grandTotal: number;
        appliedPromotions: import(".prisma/client").Prisma.JsonValue;
        paymentMethod: string;
        paymentAccountId: string | null;
        status: string;
        cashShiftId: string | null;
        createdAt: Date;
        syncedAt: Date;
    }>;
}
