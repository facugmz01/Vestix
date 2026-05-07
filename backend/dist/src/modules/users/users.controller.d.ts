import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        roleId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
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
        email: string;
        fullName: string;
    }>;
    findAll(): Promise<({
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
    })[]>;
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
        role: {
            id: string;
            name: string;
        };
        roleId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
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
        email: string;
        fullName: string;
    }>;
    activate(id: string): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        roleId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
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
        email: string;
        fullName: string;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        roleId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
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
        email: string;
        fullName: string;
    }>;
    assignBranches(id: string, assignBranchesDto: AssignBranchesDto): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        roleId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
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
        email: string;
        fullName: string;
    }>;
}
