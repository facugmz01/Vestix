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
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }>;
    findAll(): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }>;
    findByEmail(email: string): Promise<{
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
        roleId: string;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }>;
    toggleActivation(id: string, isActive: boolean): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }>;
    assignBranches(id: string, assignBranchesDto: AssignBranchesDto): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }>;
    private userSelect;
}
