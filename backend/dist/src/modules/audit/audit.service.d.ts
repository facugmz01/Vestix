import { PrismaService } from '../../core/prisma/prisma.service';
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    ACCESS_DENIED = "ACCESS_DENIED",
    EXPORT = "EXPORT",
    RECONCILE = "RECONCILE"
}
export interface LogPayload {
    userId: string;
    userEmail?: string;
    ipAddress?: string;
    requestId?: string;
    action: AuditAction | string;
    resource: string;
    resourceId?: string;
    previousValue?: Record<string, any>;
    newValue?: Record<string, any>;
    module: string;
    description?: string;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(payload: LogPayload): Promise<void>;
    getResourceHistory(resource: string, resourceId: string): Promise<{
        id: string;
        userId: string | null;
        userEmail: string | null;
        ipAddress: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        previousValue: import(".prisma/client").Prisma.JsonValue | null;
        newValue: import(".prisma/client").Prisma.JsonValue | null;
        module: string | null;
        description: string | null;
        createdAt: Date;
    }[]>;
    getUserTrail(userId: string, fromDate?: Date, toDate?: Date): Promise<{
        id: string;
        userId: string | null;
        userEmail: string | null;
        ipAddress: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        previousValue: import(".prisma/client").Prisma.JsonValue | null;
        newValue: import(".prisma/client").Prisma.JsonValue | null;
        module: string | null;
        description: string | null;
        createdAt: Date;
    }[]>;
    getSecurityEvents(fromDate?: Date): Promise<{
        id: string;
        userId: string | null;
        userEmail: string | null;
        ipAddress: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        previousValue: import(".prisma/client").Prisma.JsonValue | null;
        newValue: import(".prisma/client").Prisma.JsonValue | null;
        module: string | null;
        description: string | null;
        createdAt: Date;
    }[]>;
    getModuleActivity(module: string, limit?: number): Promise<{
        id: string;
        userId: string | null;
        userEmail: string | null;
        ipAddress: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        previousValue: import(".prisma/client").Prisma.JsonValue | null;
        newValue: import(".prisma/client").Prisma.JsonValue | null;
        module: string | null;
        description: string | null;
        createdAt: Date;
    }[]>;
    private sanitize;
}
