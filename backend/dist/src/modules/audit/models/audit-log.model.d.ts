export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    ACCESS_DENIED = "ACCESS_DENIED",
    EXPORT = "EXPORT"
}
export interface AuditLog {
    id: string;
    userId: string;
    userEmail?: string;
    ipAddress?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    previousValue?: Record<string, any>;
    newValue?: Record<string, any>;
    module: string;
    description?: string;
    createdAt: Date;
}
