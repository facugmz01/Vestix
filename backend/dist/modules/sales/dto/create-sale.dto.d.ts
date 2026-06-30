export declare class SaleLineDto {
    variantId: string;
    categoryId?: string;
    quantity: number;
    unitPriceOverride?: number;
    discountPct?: number;
}
export declare class CreateSaleDto {
    id?: string;
    branchId: string;
    warehouseId: string;
    customerId?: string;
    source?: 'POS' | 'ECOMMERCE' | 'BACKOFFICE';
    paymentMethod?: 'CASH' | 'CREDIT_CARD' | 'CUSTOMER_CREDIT' | 'BANK_TRANSFER' | 'MULTIPLE' | 'MIXED';
    paymentAccountId?: string;
    cashShiftId?: string;
    status?: string;
    createdAtIso?: string;
    posGrandTotal?: number;
    cartDiscountTotal?: number;
    lines: SaleLineDto[];
}
