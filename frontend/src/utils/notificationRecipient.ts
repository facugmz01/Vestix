export type NotificationChannel = 'EMAIL' | 'WHATSAPP';

export interface ContactInfo {
  phone?: string | null;
  email?: string | null;
}

export interface ResolvedRecipient {
  channel: NotificationChannel;
  recipient: string;
  label: string;
}

/** Normalize phone to international format without '+' (Argentina-friendly). */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8) return null;
  if (digits.startsWith('549') && digits.length >= 12) return digits;
  if (digits.startsWith('54') && digits.length >= 11) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `54${digits.slice(1)}`;
  if (digits.length >= 8 && digits.length <= 11) return `549${digits}`;
  return digits;
}

export function resolveEmailRecipient(email?: string | null): string | null {
  if (!email?.trim()) return null;
  const trimmed = email.trim();
  return trimmed.includes('@') ? trimmed : null;
}

/** Prefer WhatsApp when a valid phone exists; otherwise fall back to email. */
export function resolveManualNotificationRecipient(
  contact: ContactInfo,
  prefer: NotificationChannel = 'WHATSAPP',
): ResolvedRecipient | null {
  const phone = normalizePhone(contact.phone);
  const email = resolveEmailRecipient(contact.email);

  if (prefer === 'WHATSAPP') {
    if (phone) {
      return { channel: 'WHATSAPP', recipient: phone, label: `WhatsApp +${phone}` };
    }
    if (email) {
      return { channel: 'EMAIL', recipient: email, label: `Email ${email}` };
    }
    return null;
  }

  if (email) {
    return { channel: 'EMAIL', recipient: email, label: `Email ${email}` };
  }
  if (phone) {
    return { channel: 'WHATSAPP', recipient: phone, label: `WhatsApp +${phone}` };
  }
  return null;
}

export function contactMissingMessage(entityLabel: string): string {
  return `${entityLabel} no tiene teléfono ni email configurado. Actualizá los datos de contacto antes de enviar.`;
}
