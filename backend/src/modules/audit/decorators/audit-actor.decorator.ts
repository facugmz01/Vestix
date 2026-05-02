import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Convenience decorator to extract the audit actor from the active HTTP request.
 * Usage: @AuditActor() actor: AuditActorDto
 */
export const AuditActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      userId: request.user?.id ?? 'anonymous',
      userEmail: request.user?.email,
      ipAddress: request.ip,
    };
  },
);
