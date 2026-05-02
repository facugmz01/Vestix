import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(dto: CreateCustomerDto): Promise<any>;
    findAll(query: any): Promise<{
        data: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    remove(id: string): Promise<{
        id: string;
        type: string;
        fullName: string;
        taxId: string | null;
        email: string | null;
        phone: string | null;
        creditLimit: number;
        usedCredit: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
