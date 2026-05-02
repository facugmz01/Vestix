import { SalesService } from './sales.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class SalesController {
    private readonly salesService;
    private readonly checkoutOrchestrator;
    constructor(salesService: SalesService, checkoutOrchestrator: CheckoutOrchestrator);
    checkout(createOrderDto: CreateOrderDto): Promise<{
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
