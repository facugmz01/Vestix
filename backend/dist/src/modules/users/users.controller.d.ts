import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        branchId: string;
        id: string;
        updatedAt: Date;
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
        createdAt: Date;
        role: {
            id: string;
            name: string;
        };
        isActive: boolean;
        email: string;
        fullName: string;
        roleId: string;
    }>;
    findAll(): Promise<({
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
    })[]>;
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
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        branchId: string;
        id: string;
        updatedAt: Date;
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
        createdAt: Date;
        role: {
            id: string;
            name: string;
        };
        isActive: boolean;
        email: string;
        fullName: string;
        roleId: string;
    }>;
    activate(id: string): Promise<{
        branchId: string;
        id: string;
        updatedAt: Date;
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
        createdAt: Date;
        role: {
            id: string;
            name: string;
        };
        isActive: boolean;
        email: string;
        fullName: string;
        roleId: string;
    }>;
    deactivate(id: string): Promise<{
        branchId: string;
        id: string;
        updatedAt: Date;
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
        createdAt: Date;
        role: {
            id: string;
            name: string;
        };
        isActive: boolean;
        email: string;
        fullName: string;
        roleId: string;
    }>;
    assignBranches(id: string, assignBranchesDto: AssignBranchesDto): Promise<{
        branchId: string;
        id: string;
        updatedAt: Date;
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
        createdAt: Date;
        role: {
            id: string;
            name: string;
        };
        isActive: boolean;
        email: string;
        fullName: string;
        roleId: string;
    }>;
}
