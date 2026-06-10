import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { InventoryService } from '../../logistics/inventory.service';
import { AfipProducer } from '../../invoicing/afip.producer';
export declare class ReturnsService {
    private readonly prisma;
    private readonly inventoryService;
    private readonly afipProducer;
    constructor(prisma: PrismaService, inventoryService: InventoryService, afipProducer: AfipProducer);
    getReturns(params: {
        page?: any;
        pageSize?: any;
        search?: string;
        status?: string;
    }): Promise<{
        data: {
            customerName: string;
            totalRefundAmount: number;
            lines: {
                id: string;
                returnId: string;
                orderLineId: string;
                variantId: string;
                quantity: number;
                unitPrice: number;
                condition: string;
                reason: string | null;
            }[];
            saleOrder: {
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
            };
            id: string;
            saleOrderId: string;
            branchId: string;
            action: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    getReturnById(id: string): Promise<{
        lines: ({
            orderLine: {
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
                historicalSku: string | null;
                historicalName: string | null;
                historicalCost: number | null;
            };
        } & {
            id: string;
            returnId: string;
            orderLineId: string;
            variantId: string;
            quantity: number;
            unitPrice: number;
            condition: string;
            reason: string | null;
        })[];
        saleOrder: {
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
        };
    } & {
        id: string;
        saleOrderId: string;
        branchId: string;
        action: string;
        status: string;
        totalRefundAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    processReturn(dto: CreateReturnDto): Promise<{
        lines: {
            id: string;
            returnId: string;
            orderLineId: string;
            variantId: string;
            quantity: number;
            unitPrice: number;
            condition: string;
            reason: string | null;
        }[];
    } & {
        id: string;
        saleOrderId: string;
        branchId: string;
        action: string;
        status: string;
        totalRefundAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
