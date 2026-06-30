import { TransfersService } from './transfers.service';
import { CreateTransferDto, ReceiveTransferDto } from './dto/transfer.dto';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    findAll(query: any): Promise<{
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
    createTransfer(dto: CreateTransferDto, req: any): Promise<{
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
    cancelTransfer(id: string): import(".prisma/client").Prisma.Prisma__StockTransferClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
