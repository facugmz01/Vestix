export declare class ScanBarcodeDto {
    barcode: string;
}
export declare class QuickSaleDto {
    cashRegisterId: string;
    variantId: string;
    categoryId: string;
    accountId: string;
    cashShiftId?: string;
}
declare class CartLineDto {
    variantId: string;
    quantity: number;
    discountPct?: number;
}
export declare class CalculateCartDto {
    lines: CartLineDto[];
    cartDiscountPct?: number;
    customerId?: string;
}
export declare class OpenSessionDto {
    cashRegisterId: string;
    openingAmount: number;
    userId?: string;
}
export declare class CloseSessionDto {
    shiftId: string;
    closingAmount: number;
    userId?: string;
    notes?: string;
}
export {};
