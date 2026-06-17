import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateTransferDto, ReceiveTransferDto } from './dto/transfer.dto';
export declare class TransfersService {
    prisma: PrismaService;
    private inventoryService;
    constructor(prisma: PrismaService, inventoryService: InventoryService);
    createTransfer(dto: CreateTransferDto, userId: string): Promise<{
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    dispatchTransfer(id: string): Promise<{
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    receiveTransfer(id: string, dto: ReceiveTransferDto): Promise<{
        lines: {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(filters: any): Promise<{
        data: ({
            lines: {
                id: string;
                transferId: string;
                variantId: string;
                quantity: number;
                receivedQuantity: number | null;
                createdAt: Date;
            }[];
        } & {
            id: string;
            sourceWarehouseId: string;
            destinationWarehouseId: string;
            status: string;
            trackingNumber: string | null;
            notes: string | null;
            requestedByUserId: string | null;
            dispatchedAt: Date | null;
            receivedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
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
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        })[];
    } & {
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
