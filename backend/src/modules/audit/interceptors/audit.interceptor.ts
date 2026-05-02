import { Injectable, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService, AuditAction } from '../audit.service';
import { AuditContextService } from '../../../core/audit-context/audit-context.service';
import * as crypto from 'crypto';

/**
 * Interceptor that:
 * 1. Populates AsyncLocalStorage with the authenticated actor for the duration of the request.
 * 2. Automatically logs HTTP mutations (POST/PATCH/PUT/DELETE) without manual service calls.
 *
 * Apply globally in AppModule or selectively on sensitive controllers.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditContextService: AuditContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request  = context.switchToHttp().getRequest();
    const method   = request.method;
    const userId   = request.user?.id ?? 'anonymous';
    const userEmail = request.user?.email;
    const ipAddress = request.ip;
    const requestId = crypto.randomUUID(); // Correlates all DB ops within this request

    // Populate AsyncLocalStorage so Prisma middleware can read the actor identity
    return new Observable((subscriber) => {
      this.auditContextService.run({ userId, userEmail, ipAddress, requestId }, () => {
        next.handle().pipe(
          tap(() => {
            // Only log HTTP mutations at the controller layer
            if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) return;

            const resource = context.getClass().name.replace('Controller', '');
            const action   = method === 'POST'   ? AuditAction.CREATE
                           : method === 'DELETE' ? AuditAction.DELETE
                           : AuditAction.UPDATE;

            this.auditService.log({
              userId, userEmail, ipAddress, requestId,
              action, resource,
              module:      context.getClass().name,
              description: `${method} ${request.url}`,
            }).catch(() => {}); // Never crash the application for audit logging
          })
        ).subscribe(subscriber);
      });
    });
  }
}

