import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // No roles restricted
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role || !user.role.name) {
      return false;
    }

    // Super Admin overrides everything
    if (user.role.name === 'Super Admin') {
      return true;
    }

    return requiredRoles.includes(user.role.name);
  }
}
