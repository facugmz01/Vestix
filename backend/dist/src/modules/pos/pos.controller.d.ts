import { PosService } from './pos.service';
import { ScanBarcodeDto } from './dto/scan-barcode.dto';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    downloadPosCatalog(): Promise<{
        status: string;
        data: any[];
    }>;
    scanBarcode(scanDto: ScanBarcodeDto): Promise<{
        variantId: string;
        categoryId: string;
        sku: string;
        name: string;
        basePrice: number;
    }>;
    quickSale(body: any): Promise<{
        status: string;
        order: {
            id: string;
            branchId: string;
            source: string;
            customerId: string | null;
            subtotal: number;
            cartDiscountTotal: number;
            grandTotal: number;
            appliedPromotions: import(".prisma/client").Prisma.JsonValue;
            paymentMethod: string;
            paymentAccountId: string | null;
            createdAt: Date;
            syncedAt: Date;
        };
    }>;
    calculateCart(dto: any): Promise<{
        subtotal: number;
        lineDiscountsTotal: number;
        cartDiscountTotal: number;
        grandTotal: number;
        lines: {
            variantId: any;
            originalPrice: any;
            finalPrice: any;
        }[];
    }>;
}
