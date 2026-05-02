import { Customer, CustomerHistoryRecord } from './models/customer.model';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomersService {
    private customers;
    private history;
    createCustomer(dto: CreateCustomerDto): Promise<Customer>;
    getCustomer(id: string): Promise<Customer>;
    updateCreditLimit(id: string, newLimit: number, userId: string): Promise<import("./models/customer.model").CustomerCredit>;
    consumeCredit(id: string, amount: number, orderId: string): Promise<import("./models/customer.model").CustomerCredit>;
    repayCredit(id: string, amount: number, paymentReceiptId: string): Promise<import("./models/customer.model").CustomerCredit>;
    getCustomerHistory(id: string): Promise<CustomerHistoryRecord[]>;
    private logHistory;
}
