import { CustomerType } from '../models/customer.model';
export declare class CreateCustomerDto {
    type: CustomerType;
    fullName: string;
    taxId?: string;
    email?: string;
    phone?: string;
    creditLimit?: number;
}
