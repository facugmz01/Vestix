import { normalizeWhatsAppPhone, phoneFromWhatsAppJid } from './phone.util';

describe('normalizeWhatsAppPhone', () => {
  it('keeps correct AR WhatsApp numbers', () => {
    expect(normalizeWhatsAppPhone('5491122334455')).toBe('5491122334455');
    expect(normalizeWhatsAppPhone('+54 9 11 2233-4455')).toBe('5491122334455');
  });

  it('inserts mobile 9 when country 54 is present without it', () => {
    expect(normalizeWhatsAppPhone('541122334455')).toBe('5491122334455');
    expect(normalizeWhatsAppPhone('+54 11 2233-4455')).toBe('5491122334455');
  });

  it('handles national trunk 0 by adding 549', () => {
    expect(normalizeWhatsAppPhone('01122334455')).toBe('5491122334455');
    expect(normalizeWhatsAppPhone('03511234567')).toBe('5493511234567');
  });

  it('handles local numbers without country code', () => {
    expect(normalizeWhatsAppPhone('1122334455')).toBe('5491122334455');
    expect(normalizeWhatsAppPhone('11 2233-4455')).toBe('5491122334455');
  });

  it('returns null for empty or too-short input', () => {
    expect(normalizeWhatsAppPhone(null)).toBeNull();
    expect(normalizeWhatsAppPhone('')).toBeNull();
    expect(normalizeWhatsAppPhone('123')).toBeNull();
  });
});

describe('phoneFromWhatsAppJid', () => {
  it('extracts digits from Evolution JIDs', () => {
    expect(phoneFromWhatsAppJid('5491122334455@s.whatsapp.net')).toBe('5491122334455');
    expect(phoneFromWhatsAppJid('5491122334455@c.us')).toBe('5491122334455');
  });

  it('returns null for invalid jids', () => {
    expect(phoneFromWhatsAppJid(null)).toBeNull();
    expect(phoneFromWhatsAppJid('')).toBeNull();
    expect(phoneFromWhatsAppJid('@s.whatsapp.net')).toBeNull();
  });
});
