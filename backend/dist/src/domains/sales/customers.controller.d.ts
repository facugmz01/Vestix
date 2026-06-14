import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { BulkImportBalancesDto } from './dto/bulk-balances.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(dto: CreateCustomerDto): Promise<any>;
    bulkImportBalances(dto: BulkImportBalancesDto): Promise<{
        success: boolean;
        updatedCount: number;
        notFound: any[];
    }>;
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
        priceListId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
