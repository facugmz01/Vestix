import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  ANY_PERMISSIONS_KEY,
  RequiredPermission,
} from '../decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RbacService } from '../rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const anyPermissions = this.reflector.getAllAndOverride<RequiredPermission[][]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if ((!anyPermissions || anyPermissions.length === 0) &&
        (!requiredPermissions || requiredPermissions.length === 0)) {
      throw new ForbiddenException('Security Policy Violation: Route lacks explicit permission metadata.');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User identity or role not found');
    }

    if (anyPermissions && anyPermissions.length > 0) {
      for (const alternative of anyPermissions) {
        const allowed = await this.rbacService.validateUserPermissions(
          user.roleId,
          alternative,
        );
        if (allowed) return true;
      }
      throw new ForbiddenException('Insufficient permissions to perform this action');
    }

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
