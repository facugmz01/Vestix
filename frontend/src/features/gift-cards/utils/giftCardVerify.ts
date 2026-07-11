export function extractGiftCardVerifyToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/gift-cards\/verify\/([^/?#]+)/i);
  if (urlMatch?.[1]) return decodeURIComponent(urlMatch[1]);

  const tokenMatch = trimmed.match(/^VESTIX-GC:([A-F0-9-]{36})$/i);
  if (tokenMatch?.[1]) return tokenMatch[1];

  if (/^[A-F0-9-]{36}$/i.test(trimmed)) return trimmed;

  return null;
}
