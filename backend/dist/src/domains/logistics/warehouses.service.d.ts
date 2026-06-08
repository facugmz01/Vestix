import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
export declare class WarehousesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateWarehouseDto): Promise<{
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string | null;
        type: string | null;
        address: string | null;
        isActive: boolean;
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query?: any): Promise<{
        data: ({
            branch: {
                id: string;
                name: string;
                code: string;
                address: string | null;
                phone: string | null;
                isMain: boolean;
                isActive: boolean;
                settings: import(".prisma/client").Prisma.JsonValue | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            code: string | null;
            type: string | null;
            address: string | null;
            isActive: boolean;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string | null;
        type: string | null;
        address: string | null;
        isActive: boolean;
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateWarehouseDto): Promise<{
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string | null;
        type: string | null;
        address: string | null;
        isActive: boolean;
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        code: string | null;
        type: string | null;
        address: string | null;
        isActive: boolean;
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
