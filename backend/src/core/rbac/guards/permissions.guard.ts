import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/require-permissions.decorator';
import { RbacService } from '../rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Default Deny: All routes must explicitly declare permissions or be marked public.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      throw new ForbiddenException('Security Policy Violation: Route lacks explicit permission metadata.');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Expected to be populated by an AuthGuard before this

    if (!user || !user.roleId) {
      throw new ForbiddenException('User identity or role not found');
    }

    // Validate against the database/cache via the RbacService
    const hasPermission = await this.rbacService.validateUserPermissions(
      user.roleId, 
      requiredPermissions
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to perform this action');
    }

    return true;
  }
}
