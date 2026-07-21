/**
 * Cookie `Secure` flag for auth sessions.
 *
 * - COOKIE_SECURE=true|false forces the value (useful for Docker HTTP labs).
 * - Otherwise defaults to Secure when NODE_ENV=production.
 */
export function isCookieSecure(): boolean {
  const raw = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return process.env.NODE_ENV === 'production';
}
