/**
 * Helpers for storefront customer profile completeness.
 * A profile is considered incomplete when auto-generated placeholder data
 * is still present or required contact / fiscal fields are missing.
 */
export interface StorefrontCustomerProfile {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
}

export function isPlaceholderFullName(
  fullName: string | null | undefined,
  email?: string | null,
): boolean {
  if (!fullName?.trim()) return true;
  const name = fullName.trim();
  if (name.startsWith('Cliente +')) return true;
  if (email && name === email.split('@')[0]) return true;
  return false;
}

export function isStorefrontProfileIncomplete(
  customer: StorefrontCustomerProfile,
): boolean {
  if (isPlaceholderFullName(customer.fullName, customer.email)) return true;
  if (!customer.taxId?.trim()) return true;
  if (!customer.email?.trim()) return true;
  if (!customer.phone?.trim()) return true;
  return false;
}

export function toStorefrontCustomerResponse(customer: {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  taxId: string | null;
}) {
  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    taxId: customer.taxId,
    profileComplete: !isStorefrontProfileIncomplete(customer),
  };
}
