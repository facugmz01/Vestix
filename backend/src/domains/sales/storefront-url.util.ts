import { Request } from 'express';

/**
 * Resolves the public storefront base URL for Mercado Pago return links.
 * Priority: MP_STORE_URL env → request Origin/Referer → localhost fallback.
 */
export function resolveStorefrontBaseUrl(req?: Request): string {
  const configured = process.env.MP_STORE_URL?.replace(/\/$/, '');
  if (configured) return configured;

  const origin = req?.headers?.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      const isStorefrontHost = url.hostname.startsWith('tienda.');
      return `${url.origin}${isStorefrontHost ? '' : '/store'}`;
    } catch {
      // fall through
    }
  }

  const referer = req?.headers?.referer;
  if (referer) {
    try {
      const url = new URL(referer);
      const path = url.pathname.startsWith('/store') ? '/store' : '';
      return `${url.origin}${path}`;
    } catch {
      // fall through
    }
  }

  return 'http://localhost:3000/store';
}
