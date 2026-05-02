import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { RulesEngineService } from '../pricing/rules-engine.service';
import { AfipProducer } from '../afip/afip.producer';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class CheckoutOrchestrator {
    private readonly prisma;
    private readonly pricingService;
    private readonly rulesEngine;
    private readonly afipProducer;
    constructor(prisma: PrismaService, pricingService: PricingService, rulesEngine: RulesEngineService, afipProducer: AfipProducer);
    processCheckout(dto: CreateOrderDto): Promise<{
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
}
