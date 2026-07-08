import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const ANY_PERMISSIONS_KEY = 'any_permissions';

export interface RequiredPermission {
  action: string;
  subject: string;
}

// Example usage: @RequirePermissions({ action: 'create', subject: 'User' })
export const RequirePermissions = (...permissions: RequiredPermission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * User must satisfy at least one permission set. Each inner array is ANDed.
 * Example: @RequireAnyPermissions([{ action: 'manage', subject: 'Users' }], [{ action: 'manage', subject: 'Settings' }])
 */
export const RequireAnyPermissions = (...alternatives: RequiredPermission[][]) =>
  SetMetadata(ANY_PERMISSIONS_KEY, alternatives);
