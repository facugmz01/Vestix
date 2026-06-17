import { PurchasingService } from './purchasing.service';
import { CreatePurchaseOrderDto } from './dto/create-po.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
export declare class PurchasingController {
    private readonly purchasingService;
    constructor(purchasingService: PurchasingService);
    createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<{
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
    receiveGoods(dto: ReceiveGoodsDto): Promise<{
        id: string;
        purchaseOrderId: string;
        destinationWarehouseId: string;
        receivedByUserId: string | null;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllOrders(query: any): Promise<{
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
    findOneOrder(id: string): Promise<{
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
                    preferredSupplierId: string | null;
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
    issueOrder(id: string): import(".prisma/client").Prisma.Prisma__PurchaseOrderClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    receiveOrder(id: string, dto: ReceiveGoodsDto): Promise<{
        id: string;
        purchaseOrderId: string;
        destinationWarehouseId: string;
        receivedByUserId: string | null;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeOrder(id: string): import(".prisma/client").Prisma.Prisma__PurchaseOrderClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAllReceipts(query: any): Promise<{
        data: ({
            lines: {
                id: string;
                receiptId: string;
                poLineItemId: string;
                variantId: string;
                expectedQuantity: number;
                receivedQuantity: number;
                difference: number;
                batchLot: string | null;
                batchExpirationDate: Date | null;
                notes: string | null;
            }[];
        } & {
            id: string;
            purchaseOrderId: string;
            destinationWarehouseId: string;
            receivedByUserId: string | null;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOneReceipt(id: string): Promise<{
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
                    preferredSupplierId: string | null;
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
            receiptId: string;
            poLineItemId: string;
            variantId: string;
            expectedQuantity: number;
            receivedQuantity: number;
            difference: number;
            batchLot: string | null;
            batchExpirationDate: Date | null;
            notes: string | null;
        })[];
    } & {
        id: string;
        purchaseOrderId: string;
        destinationWarehouseId: string;
        receivedByUserId: string | null;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
