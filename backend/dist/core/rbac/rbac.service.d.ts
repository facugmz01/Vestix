import { RequiredPermission } from './decorators/require-permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
export declare class RbacService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPermissionsForRole(roleId: string): Promise<{
        id: string;
        action: string;
        subject: string;
        roleId: string;
    }[]>;
    validateUserPermissions(roleId: string, requiredPermissions: RequiredPermission[]): Promise<boolean>;
    assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
}
