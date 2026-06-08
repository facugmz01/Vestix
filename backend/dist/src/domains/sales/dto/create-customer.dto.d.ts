export declare enum CustomerType {
    INDIVIDUAL = "INDIVIDUAL",
    BUSINESS = "BUSINESS"
}
export declare class CreateCustomerDto {
    type?: CustomerType;
    fullName: string;
    taxId?: string;
    email?: string;
    phone?: string;
    initialCreditLimit?: number;
    isActive?: boolean;
}
