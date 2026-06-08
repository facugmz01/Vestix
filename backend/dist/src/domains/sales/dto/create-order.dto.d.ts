import { OrderSource, PaymentMethod } from '../models/order.model';
declare class OrderLineDto {
    variantId: string;
    categoryId?: string;
    quantity: number;
    discountPct?: number;
    unitPriceOverride?: number;
}
export declare class CreateOrderDto {
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
}
export {};
