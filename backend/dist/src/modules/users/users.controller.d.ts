import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }>;
    activate(id: string): Promise<{
        id: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    }>;
    deactivate(id: string): Promise<{
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
}
