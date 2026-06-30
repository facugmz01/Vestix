import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createBranchDto: CreateBranchDto): Promise<{
        warehouses: {
            id: string;
            name: string;
            code: string | null;
            type: string | null;
            address: string | null;
            isActive: boolean;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
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
    }>;
    findAll(query?: any): Promise<{
        data: {
            userCount: number;
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
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        warehouses: {
            id: string;
            name: string;
            code: string | null;
            type: string | null;
            address: string | null;
            isActive: boolean;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
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
    }>;
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<{
        warehouses: {
            id: string;
            name: string;
            code: string | null;
            type: string | null;
            address: string | null;
            isActive: boolean;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    assignUserToBranch(branchId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
