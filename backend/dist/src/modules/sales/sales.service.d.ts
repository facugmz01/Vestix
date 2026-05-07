import { PrismaService } from '../../core/prisma/prisma.service';
export declare class SalesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOrderById(id: string): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
        };
        lines: ({
            variant: {
                product: {
                    id: string;
                    name: string;
                    baseSku: string | null;
                    description: string | null;
                    categoryId: string;
                    brandId: string | null;
                    isVariable: boolean;
                    costPrice: number;
                    isActive: boolean;
                    isPublished: boolean;
                    images: import(".prisma/client").Prisma.JsonValue;
                    metadata: import(".prisma/client").Prisma.JsonValue;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                productId: string;
                sku: string;
                barcode: string | null;
                size: string | null;
                color: string | null;
                imageUrl: string | null;
                costPrice: number;
                basePrice: number;
                isActive: boolean;
                attributes: import(".prisma/client").Prisma.JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            orderId: string;
            variantId: string;
            categoryId: string;
            quantity: number;
            basePrice: number;
            discountAmount: number;
            finalPrice: number;
        })[];
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
        createdAt: Date;
        syncedAt: Date;
    }>;
    listRecentOrders(branchId: string): Promise<({
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
    })[]>;
    getOrders(params: {
        page?: any;
        pageSize?: any;
        search?: string;
        status?: string;
    }): Promise<{
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
            createdAt: Date;
            syncedAt: Date;
        }[];
        total: number;
    }>;
}
