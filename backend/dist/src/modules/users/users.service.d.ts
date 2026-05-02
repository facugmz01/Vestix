import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        password: string;
        roleId: string;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }>;
    toggleActivation(id: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }>;
    assignBranches(id: string, assignBranchesDto: AssignBranchesDto): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }>;
    private userSelect;
}
