import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapCustomer;
    create(dto: CreateCustomerDto): Promise<any>;
    findAll(query?: any): Promise<{
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
    repayCredit(id: string, amount: number, reference: string): Promise<{
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
    chargeCredit(id: string, amount: number, reference: string): Promise<{
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
