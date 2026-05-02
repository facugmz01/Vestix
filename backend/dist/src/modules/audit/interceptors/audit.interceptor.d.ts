import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditService } from '../audit.service';
import { AuditContextService } from '../../../core/audit-context/audit-context.service';
export declare class AuditInterceptor implements NestInterceptor {
    private readonly auditService;
    private readonly auditContextService;
    constructor(auditService: AuditService, auditContextService: AuditContextService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
