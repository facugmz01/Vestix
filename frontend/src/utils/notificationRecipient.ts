export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

export interface ContactInfo {
  phone?: string | null;
  email?: string | null;
}

export interface ResolvedRecipient {
  channel: NotificationChannel;
  recipient: string;
  label: string;
}

/**
 * Normalize phone to WhatsApp international format without '+' (Argentina-first).
 * Always inserts the mobile "9" after 54 so Evolution delivers to the real handset
 * (5411… appears in Manager chats but never reaches the phone).
 */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length < 8) return null;
  if (digits.startsWith('549') && digits.length >= 12) return digits;
  if (digits.startsWith('54') && !digits.startsWith('549') && digits.length >= 11) {
    return `549${digits.slice(2)}`;
  }
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
    if (digits.length < 8) return null;
    return `549${digits}`;
  }
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

  if (prefer === 'WHATSAPP' || prefer === 'SMS') {
    if (phone) {
      const label = prefer === 'SMS' ? `SMS +${phone}` : `WhatsApp +${phone}`;
      return { channel: prefer, recipient: phone, label };
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
