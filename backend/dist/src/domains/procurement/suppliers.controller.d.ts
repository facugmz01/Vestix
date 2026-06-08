import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(dto: CreateSupplierDto): Promise<any>;
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
