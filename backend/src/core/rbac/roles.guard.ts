import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * @deprecated Use PermissionsGuard + @RequirePermissions instead.
 * This guard expected user.role.name on the JWT payload, which is incompatible
 * with the current cookie-based auth (req.user = { userId, email, roleId }).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role || !user.role.name) {
      return false;
    }

    if (user.role.name === 'Super Admin' || user.role.name === 'SUPER_ADMIN') {
      return true;
    }

    return requiredRoles.includes(user.role.name);
  }
}
