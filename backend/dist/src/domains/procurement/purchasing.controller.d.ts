import { PurchasingService } from './purchasing.service';
import { BulkImportPurchasesDto } from './dto/bulk-purchases.dto';
export declare class PurchasingController {
    private readonly purchasingService;
    constructor(purchasingService: PurchasingService);
    findAll(query: any): Promise<{
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
    bulkImportPurchases(dto: BulkImportPurchasesDto): Promise<{
        success: boolean;
        createdCount: number;
        errorCount: number;
        errors: string[];
    }>;
    processDirectPurchase(dto: any): Promise<{
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
    autoReplenish(): Promise<{
        success: boolean;
        message: string;
        ordersCreated: number;
    }>;
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
    findOne(id: string): Promise<{
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
                    type: import(".prisma/client").$Enums.ProductType;
                    isVariable: boolean;
                    manageBatches: boolean;
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
    update(id: string, dto: any): Promise<{
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
    remove(id: string): Promise<{
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
