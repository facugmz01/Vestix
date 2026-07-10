import { RequiredPermission } from './decorators/require-permissions.decorator';

export interface PermissionTuple {
  action: string;
  subject: string;
}

/** Subjects covered by manage/Settings (settings umbrella). */
const SETTINGS_UMBRELLA_SUBJECTS = new Set(['Settings', 'System', 'Branch', 'Integrations', 'Backups']);

/**
 * Returns true when a role's permission tuple satisfies a required permission.
 * Semantics mirror the frontend auth store:
 * - manage/all → full access
 * - manage/{subject} → any action on that subject
 * - manage/Settings → settings umbrella (Settings, System, Branch)
 */
export function permissionMatches(
  held: PermissionTuple,
  required: RequiredPermission,
): boolean {
  if (held.action === 'manage' && held.subject === 'all') {
    return true;
  }

  if (
    held.action === 'manage' &&
    held.subject === 'Settings' &&
    SETTINGS_UMBRELLA_SUBJECTS.has(required.subject)
  ) {
    return true;
  }

  if (held.action === 'manage' && held.subject === required.subject) {
    return true;
  }

  return held.action === required.action && held.subject === required.subject;
}

export function roleHasPermissions(
  userPermissions: PermissionTuple[],
  requiredPermissions: RequiredPermission[],
): boolean {
  const isSuperAdmin = userPermissions.some(
    (p) => p.action === 'manage' && p.subject === 'all',
  );
  if (isSuperAdmin) return true;

  return requiredPermissions.every((required) =>
    userPermissions.some((held) => permissionMatches(held, required)),
  );
}
