import { PurchasingService } from './purchasing.service';
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
