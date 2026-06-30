import { SalesService } from './sales.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { CreateOrderDto } from './dto/create-order.dto';
import { BulkImportSalesDto } from './dto/bulk-sales.dto';
export declare class SalesController {
    private readonly salesService;
    private readonly checkoutOrchestrator;
    constructor(salesService: SalesService, checkoutOrchestrator: CheckoutOrchestrator);
    checkout(createOrderDto: CreateOrderDto, req: any): Promise<{
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
            issueInvoice: boolean;
            createdAt: Date;
            syncedAt: Date;
        };
    }>;
    getReturns(): Promise<{
        data: any[];
        total: number;
    }>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<{
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
        issueInvoice: boolean;
        createdAt: Date;
        syncedAt: Date;
    }>;
    bulkImportSales(dto: BulkImportSalesDto): Promise<{
        success: boolean;
        createdCount: number;
        errorCount: number;
        errors: string[];
    }>;
    getOrders(query: any): Promise<{
        data: {
            customerName: string;
            customer: {
                id: string;
                type: string;
                fullName: string;
                taxId: string | null;
                email: string | null;
                phone: string | null;
                creditLimit: number;
                usedCredit: number;
                isActive: boolean;
                priceListId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
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
            issueInvoice: boolean;
            createdAt: Date;
            syncedAt: Date;
        }[];
        total: number;
    }>;
    getOrder(id: string): Promise<{
        customer: {
            id: string;
            type: string;
            fullName: string;
            taxId: string | null;
            email: string | null;
            phone: string | null;
            creditLimit: number;
            usedCredit: number;
            isActive: boolean;
            priceListId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
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
        variance: {
            id: string;
            orderId: string;
            posTotal: number;
            serverTotal: number;
            difference: number;
            resolved: boolean;
            createdAt: Date;
        };
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
        issueInvoice: boolean;
        createdAt: Date;
        syncedAt: Date;
    }>;
    confirmOrder(id: string): Promise<{
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
        issueInvoice: boolean;
        createdAt: Date;
        syncedAt: Date;
    }>;
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
        issueInvoice: boolean;
        createdAt: Date;
        syncedAt: Date;
    }>;
    sendManualReceipt(id: string, body: {
        channel: 'EMAIL' | 'WHATSAPP';
        recipient: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
