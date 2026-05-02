import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RbacService } from '../rbac.service';

@Injectable()
export class RbacContextMiddleware implements NestMiddleware {
  constructor(private rbacService: RbacService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    // If the user is authenticated, pre-load their permissions into the request object.
    // This allows controllers to perform granular inline checks if a Guard is too rigid.
    if (user && user.roleId) {
      try {
        const permissions = await this.rbacService.getPermissionsForRole(user.roleId);
        (req as any).permissions = permissions;
      } catch (error) {
        // Log error, but don't block the request here. The Guard will catch authorization failures.
        console.error('Failed to load RBAC context', error);
      }
    }

    next();
  }
}
