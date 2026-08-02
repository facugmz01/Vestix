/**
 * Normalize a phone number for WhatsApp (Argentina-first).
 *
 * WhatsApp AR mobiles require country 54 + mobile prefix 9 + area + number,
 * e.g. CABA 11 2233-4455 → 5491122334455.
 *
 * Common bad inputs that Evolution accepts (shows in Manager) but never deliver:
 * - 541122334455 (missing 9)
 * - 01122334455 → previously became 541122334455 (missing 9)
 */
export function normalizeWhatsAppPhone(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length < 8) return null;

  // Already in AR WhatsApp form: 549…
  if (digits.startsWith('549') && digits.length >= 12) {
    return digits;
  }

  // 54 without mobile 9 (e.g. 5411… from address books / leading 0)
  if (digits.startsWith('54') && !digits.startsWith('549') && digits.length >= 11) {
    return `549${digits.slice(2)}`;
  }

  // National with trunk 0: 011… / 0351… → drop zeros then add 549
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
    if (digits.length < 8) return null;
    return `549${digits}`;
  }

  // Local mobile without country code
  if (digits.length >= 8 && digits.length <= 11) {
    return `549${digits}`;
  }

  return digits;
}

/** Strip @s.whatsapp.net / @c.us from an Evolution JID → digits only. */
export function phoneFromWhatsAppJid(jid?: string | null): string | null {
  if (!jid) return null;
  const user = jid.split('@')[0] || '';
  const digits = user.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}
