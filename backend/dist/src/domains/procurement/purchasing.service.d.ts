import { PrismaService } from '../../core/prisma/prisma.service';
import { StockMovementService } from '../logistics/stock-movement.service';
export declare class PurchasingService {
    private readonly prisma;
    private readonly stockMovementService;
    private readonly logger;
    constructor(prisma: PrismaService, stockMovementService: StockMovementService);
    createPO(dto: any): Promise<{
        lines: {
            id: string;
            purchaseOrderId: string;
            variantId: string;
            orderedQuantity: number;
            receivedQuantity: number;
            unitCost: number;
            discountAmount: number;
            totalAmount: number;
        }[];
    } & {
        id: string;
        supplierId: string;
        destinationWarehouseId: string;
        status: string;
        totalAmount: number;
        paidAmount: number;
        currency: string;
        notes: string | null;
        issuedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    processDirectPurchase(dto: {
        supplierId: string;
        warehouseId: string;
        branchId: string;
        paymentAccountId?: string;
        paymentAmount?: number;
        lines: {
            variantId: string;
            quantity: number;
            unitCost: number;
            discountAmount?: number;
        }[];
        notes?: string;
    }): Promise<{
        lines: {
            id: string;
            purchaseOrderId: string;
            variantId: string;
            orderedQuantity: number;
            receivedQuantity: number;
            unitCost: number;
            discountAmount: number;
            totalAmount: number;
        }[];
    } & {
        id: string;
        supplierId: string;
        destinationWarehouseId: string;
        status: string;
        totalAmount: number;
        paidAmount: number;
        currency: string;
        notes: string | null;
        issuedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query?: any): Promise<{
        data: ({
            supplier: {
                id: string;
                companyName: string;
                contactName: string | null;
                taxId: string | null;
                email: string | null;
                phone: string | null;
                balance: number;
                currency: string;
                createdAt: Date;
                updatedAt: Date;
            };
            lines: {
                id: string;
                purchaseOrderId: string;
                variantId: string;
                orderedQuantity: number;
                receivedQuantity: number;
                unitCost: number;
                discountAmount: number;
                totalAmount: number;
            }[];
        } & {
            id: string;
            supplierId: string;
            destinationWarehouseId: string;
            status: string;
            totalAmount: number;
            paidAmount: number;
            currency: string;
            notes: string | null;
            issuedAt: Date | null;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getPO(id: string): Promise<{
        supplier: {
            id: string;
            companyName: string;
            contactName: string | null;
            taxId: string | null;
            email: string | null;
            phone: string | null;
            balance: number;
            currency: string;
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
            purchaseOrderId: string;
            variantId: string;
            orderedQuantity: number;
            receivedQuantity: number;
            unitCost: number;
            discountAmount: number;
            totalAmount: number;
        })[];
    } & {
        id: string;
        supplierId: string;
        destinationWarehouseId: string;
        status: string;
        totalAmount: number;
        paidAmount: number;
        currency: string;
        notes: string | null;
        issuedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    applyReceiptToPO(poId: string, receiptLines: {
        poLineItemId: string;
        receivedQuantity: number;
    }[]): Promise<void>;
    updatePO(id: string, dto: any): Promise<{
        lines: {
            id: string;
            purchaseOrderId: string;
            variantId: string;
            orderedQuantity: number;
            receivedQuantity: number;
            unitCost: number;
            discountAmount: number;
            totalAmount: number;
        }[];
    } & {
        id: string;
        supplierId: string;
        destinationWarehouseId: string;
        status: string;
        totalAmount: number;
        paidAmount: number;
        currency: string;
        notes: string | null;
        issuedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removePO(id: string): Promise<{
        id: string;
        supplierId: string;
        destinationWarehouseId: string;
        status: string;
        totalAmount: number;
        paidAmount: number;
        currency: string;
        notes: string | null;
        issuedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
