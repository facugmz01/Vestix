import type { AuthUser } from '@/types';

/**
 * Default landing path after login based on role and permissions.
 */
export function getDefaultHomePath(user: AuthUser | null | undefined): string {
  if (!user) return '/login';

  if (user.role === 'DELIVERY_DRIVER') {
    return '/delivery';
  }

  const canReadReports = user.role === 'SUPER_ADMIN'
    || user.permissions.some((p) =>
      (p.action === 'read' || p.action === 'manage') && (p.subject === 'Reports' || p.subject === 'all'),
    );

  if (canReadReports) {
    return '/admin';
  }

  const canReadDelivery = user.permissions.some((p) =>
    (p.action === 'read' || p.action === 'manage' || p.action === 'update')
    && p.subject === 'Delivery',
  );
  const hasOtherModules = user.permissions.some((p) => p.subject !== 'Delivery' && p.subject !== 'all');

  if (canReadDelivery && !hasOtherModules) {
    return '/delivery';
  }

  return '/admin';
}

export function isDeliveryOnlyUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'DELIVERY_DRIVER') return true;
  const perms = user.permissions.filter((p) => p.subject !== 'all');
  return perms.length > 0 && perms.every((p) => p.subject === 'Delivery');
}
