import { OrderSource, PaymentMethod } from '../models/order.model';
declare class OrderLineDto {
    variantId: string;
    categoryId?: string;
    quantity: number;
    discountPct?: number;
}
export declare class CreateOrderDto {
    id: string;
    branchId: string;
    warehouseId: string;
    source: OrderSource;
    customerId?: string;
    lines: OrderLineDto[];
    paymentMethod: PaymentMethod;
    paymentAccountId?: string;
    createdAtIso?: string;
    posGrandTotal?: number;
    wasReserved?: boolean;
}
export {};
