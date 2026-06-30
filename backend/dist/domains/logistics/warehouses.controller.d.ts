import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
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
    findAll(query: any): Promise<import("../../core/prisma/paginate").PaginatedResult<{
        id: string;
        name: string;
        code: string | null;
        type: string | null;
        address: string | null;
        isActive: boolean;
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
    }>>;
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
