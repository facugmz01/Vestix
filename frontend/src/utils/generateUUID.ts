/**
 * Universal RFC4122 v4 UUID generator and secure-context polyfill.
 * Works seamlessly in Secure Contexts (HTTPS, localhost) and Non-Secure Contexts
 * (HTTP over local network IP, mobile devices on LAN, older browsers).
 */
export function generateUUID(): string {
  // 1. Native crypto.randomUUID (when available in secure context)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }

  // 2. Fallback to crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      const buffer = new Uint8Array(16);
      crypto.getRandomValues(buffer);
      buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
      buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant RFC4122
      return [...buffer].map((b, i) => {
        const hex = b.toString(16).padStart(2, '0');
        return i === 4 || i === 6 || i === 8 || i === 10 ? `-${hex}` : hex;
      }).join('');
    } catch {
      // fallback
    }
  }

  // 3. Robust math-based fallback
  let d = Date.now();
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Polyfill window.crypto.randomUUID globally if not present in current context
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  if (typeof (window.crypto as any).randomUUID !== 'function') {
    try {
      Object.defineProperty(window.crypto, 'randomUUID', {
        value: generateUUID,
        writable: true,
        configurable: true,
      });
    } catch {
      (window.crypto as any).randomUUID = generateUUID;
    }
  }
}
