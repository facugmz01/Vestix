import { OrderSource, PaymentMethod } from '../models/order.model';
interface SharedCreateSaleDto {
    id: string;
}
interface CreateSaleLineDto {
    variantId: string;
}
declare class OrderLineDto implements CreateSaleLineDto {
    variantId: string;
    categoryId?: string;
    quantity: number;
    discountPct?: number;
    unitPriceOverride?: number;
}
export declare class CreateOrderDto implements SharedCreateSaleDto {
    id: string;
    branchId: string;
    warehouseId?: string;
    source: OrderSource;
    customerId?: string;
    lines: OrderLineDto[];
    paymentMethod: PaymentMethod;
    paymentAccountId?: string;
    status?: string;
    createdAtIso?: string;
    posGrandTotal?: number;
    cartDiscountTotal?: number;
    wasReserved?: boolean;
    cashShiftId?: string;
    issueInvoice?: boolean;
}
export {};
