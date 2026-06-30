import { PrismaService } from '../../../core/prisma/prisma.service';
export declare class SaleOrderRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
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
    findRecentByBranch(branchId: string, take?: number): Promise<({
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
    })[]>;
    findPaginated(where: any, skip: number, take: number): Promise<{
        data: ({
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
        })[];
        total: number;
    }>;
    updateStatus(id: string, status: string): Promise<{
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
}
