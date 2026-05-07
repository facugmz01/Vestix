/**
 * Storefront Domain Detection Utility
 *
 * How it works:
 * - If VITE_STOREFRONT_DOMAIN is set and the current hostname matches → storefront mode.
 * - If the hostname starts with "tienda." → storefront mode (convention-based fallback).
 *
 * This lets you run:
 *   app.roindumentaria.com.ar  → ERP Admin panel (requires login)
 *   tienda.roindumentaria.com.ar → Public online store (no login needed)
 */

const STOREFRONT_DOMAIN = import.meta.env.VITE_STOREFRONT_DOMAIN as string | undefined;
const CURRENT_HOST = window.location.hostname;

export function isStorefrontDomain(): boolean {
  if (STOREFRONT_DOMAIN && CURRENT_HOST === STOREFRONT_DOMAIN) return true;
  if (CURRENT_HOST.startsWith('tienda.')) return true;
  return false;
}

/**
 * Prefix for internal store links (works on both admin's /store/* path
 * and on the storefront domain's root /*)
 */
export function storePrefix(): string {
  return isStorefrontDomain() ? '' : '/store';
}
