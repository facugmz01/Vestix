export declare const PERMISSIONS_KEY = "permissions";
export interface RequiredPermission {
    action: string;
    subject: string;
}
export declare const RequirePermissions: (...permissions: RequiredPermission[]) => import("@nestjs/common").CustomDecorator<string>;
