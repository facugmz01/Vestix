import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: {
            id: string;
            name: string;
        };
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
        branchId: string;
        roleId: string;
    }>;
    findAll(query: any): Promise<{
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
        id: string;
        fullName: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: {
            id: string;
            name: string;
        };
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
        branchId: string;
        roleId: string;
    }>;
    activate(id: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: {
            id: string;
            name: string;
        };
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
        branchId: string;
        roleId: string;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: {
            id: string;
            name: string;
        };
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
        branchId: string;
        roleId: string;
    }>;
    assignBranches(id: string, assignBranchesDto: AssignBranchesDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: {
            id: string;
            name: string;
        };
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
        branchId: string;
        roleId: string;
    }>;
}
