import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
export declare class SuppliersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapSupplier;
    createSupplier(dto: CreateSupplierDto): Promise<any>;
    findAll(query?: any): Promise<{
        data: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getSupplier(id: string): Promise<any>;
    updateSupplier(id: string, dto: any): Promise<any>;
    deleteSupplier(id: string): Promise<{
        id: string;
        companyName: string;
        contactName: string | null;
        taxId: string | null;
        email: string | null;
        phone: string | null;
        balance: number;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
