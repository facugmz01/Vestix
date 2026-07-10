/**
 * Shared frontend permission matching — mirrors backend permission-match.util.ts
 */

export interface PermissionTuple {
  action: string;
  subject: string;
}

const SETTINGS_UMBRELLA_SUBJECTS = new Set(['Settings', 'System', 'Branch', 'Integrations', 'Backups']);

export function permissionMatches(
  held: PermissionTuple,
  action: string,
  subject: string,
): boolean {
  if (held.action === 'manage' && held.subject === 'all') {
    return true;
  }

  if (
    held.action === 'manage' &&
    held.subject === 'Settings' &&
    SETTINGS_UMBRELLA_SUBJECTS.has(subject)
  ) {
    return true;
  }

  if (held.action === 'manage' && held.subject === subject) {
    return true;
  }

  return held.action === action && held.subject === subject;
}

export function hasAnyPermission(
  permissions: PermissionTuple[],
  action: string,
  subject: string,
): boolean {
  return permissions.some((p) => permissionMatches(p, action, subject));
}
