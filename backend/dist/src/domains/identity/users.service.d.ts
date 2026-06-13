import { OnModuleInit } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class UsersService implements OnModuleInit {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    create(createUserDto: CreateUserDto): Promise<{
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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
        fullName: string;
        roleId: string;
    }>;
    findAll({ page, pageSize }: {
        page: number;
        pageSize: number;
    }): Promise<{
        data: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            branchId: string;
            isActive: boolean;
            lastLoginAt: Date;
            createdAt: Date;
        }[];
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
        role: {
            permissions: {
                id: string;
                action: string;
                subject: string;
                roleId: string;
            }[];
        } & {
            id: string;
            name: string;
        };
    } & {
        id: string;
        email: string;
        password: string;
        fullName: string | null;
        roleId: string;
        branchId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
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
        role: {
            permissions: {
                id: string;
                action: string;
                subject: string;
                roleId: string;
            }[];
        } & {
            id: string;
            name: string;
        };
    } & {
        id: string;
        email: string;
        password: string;
        fullName: string | null;
        roleId: string;
        branchId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
        fullName: string;
        roleId: string;
    }>;
    toggleActivation(id: string, isActive: boolean): Promise<{
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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
        fullName: string;
        roleId: string;
    }>;
    assignBranches(id: string, dto: AssignBranchesDto): Promise<{
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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
        fullName: string;
        roleId: string;
    }>;
    private userSelect;
}
