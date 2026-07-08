import { Injectable } from '@nestjs/common';
import { RequiredPermission } from './decorators/require-permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { roleHasPermissions } from './permission-match.util';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the flattened list of permissions for a given role.
   * In production, this heavily leverages Redis caching to prevent DB hits on every request.
   */
  async getPermissionsForRole(roleId: string) {
    const role = await this.prisma.role.findUnique({ 
      where: { id: roleId }, 
      include: { permissions: true } 
    });
    return role?.permissions || [];
  }

  /**
   * Core logic to validate if a role has the required permissions.
   */
  async validateUserPermissions(roleId: string, requiredPermissions: RequiredPermission[]): Promise<boolean> {
    const userPermissions = await this.getPermissionsForRole(roleId);
    return roleHasPermissions(userPermissions, requiredPermissions);
  }

  /**
   * Assigns a new role to a user.
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId }
    });
    return true;
  }
}
