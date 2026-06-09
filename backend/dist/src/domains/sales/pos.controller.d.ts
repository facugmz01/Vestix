import { PosService } from './pos.service';
import { ScanBarcodeDto, QuickSaleDto, CalculateCartDto, OpenSessionDto, CloseSessionDto } from './dto/pos.dtos';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    downloadPosCatalog(): Promise<{
        status: string;
        timestamp: string;
        data: {
            id: string;
            sku: string;
            barcode: string;
            name: string;
            basePrice: number;
            categoryId: string;
            categoryName: string;
            brandName: string;
        }[];
    }>;
    searchCatalog(q: string): Promise<{
        id: string;
        sku: string;
        barcode: string;
        name: string;
        category: string;
        brand: string;
        size: string;
        color: string;
        costPrice: number;
        basePrice: number;
        stock: number;
    }[]>;
    scanBarcode(scanDto: ScanBarcodeDto): Promise<{
        variantId: string;
        categoryId: string;
        sku: string;
        name: string;
        basePrice: number;
        color: string;
        size: string;
    }>;
    quickSale(dto: QuickSaleDto): Promise<{
        status: string;
        order: {
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
    }>;
    calculateCart(dto: CalculateCartDto): Promise<{
        subtotal: number;
        lineDiscountsTotal: number;
        cartDiscountTotal: number;
        grandTotal: number;
        appliedPromotions: string[];
        lines: {
            variantId: any;
            originalPrice: any;
            finalPrice: any;
            discountAmount: any;
        }[];
    }>;
    getCurrentSession(registerId: string): Promise<{
        cashRegister: {
            id: string;
            name: string;
            code: string;
            branchId: string;
            status: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    getRegisters(branchId: string): Promise<({
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string;
        branchId: string;
        status: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    openSession(dto: OpenSessionDto, userId: string): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    closeSession(dto: CloseSessionDto, userId: string): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
}
