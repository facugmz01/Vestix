export interface AuditContext {
    userId: string;
    userEmail?: string;
    ipAddress?: string;
    requestId?: string;
}
export declare class AuditContextService {
    private readonly storage;
    run<T>(context: AuditContext, fn: () => T): T;
    getContext(): AuditContext | undefined;
}
