import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesService {
    private prisma;
    private inventoryService;
    constructor(prisma: PrismaService, inventoryService: InventoryService);
    createSale(dto: CreateSaleDto): Promise<{
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
