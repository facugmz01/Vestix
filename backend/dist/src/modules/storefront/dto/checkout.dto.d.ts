export declare class CustomerInfoDto {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    documentType: string;
    documentNumber: string;
}
export declare class ShippingInfoDto {
    method: 'SHIPPING' | 'PICKUP';
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}
export declare class CartLineDto {
    variantId: string;
    quantity: number;
    price: number;
}
export declare class CheckoutDto {
    id?: string;
    customerInfo: CustomerInfoDto;
    shippingInfo: ShippingInfoDto;
    paymentMethod: string;
    cartLines: CartLineDto[];
    issueInvoice?: boolean;
}
