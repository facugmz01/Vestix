import { RequiredPermission } from './decorators/require-permissions.decorator';
export declare class RbacService {
    private rolePermissionsCache;
    getPermissionsForRole(roleId: string): Promise<any>;
    validateUserPermissions(roleId: string, requiredPermissions: RequiredPermission[]): Promise<boolean>;
    assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
}
