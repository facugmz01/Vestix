import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    generateToken(user: any): Promise<string>;
    getAdminUser(): Promise<{
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
    getUserById(id: string): Promise<{
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
}
