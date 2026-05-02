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
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }>;
    activate(id: string): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
    }>;
    deactivate(id: string): Promise<{
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
}
