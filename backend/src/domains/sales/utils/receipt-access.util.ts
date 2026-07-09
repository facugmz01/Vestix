import * as crypto from 'crypto';

function receiptSecret(): string {
  return process.env.JWT_SECRET || process.env.RECEIPT_SECRET || '';
}

export function generateReceiptAccessToken(orderId: string): string {
  return crypto
    .createHmac('sha256', receiptSecret())
    .update(`receipt:${orderId}`)
    .digest('hex')
    .slice(0, 32);
}

export function verifyReceiptAccessToken(orderId: string, token?: string | null): boolean {
  if (!token || !orderId) return false;

  const expected = generateReceiptAccessToken(orderId);
  if (token.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildPublicReceiptUrl(orderId: string, baseUrl?: string): string {
  const base = (baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const token = generateReceiptAccessToken(orderId);
  return `${base}/comprobante/${orderId}?t=${token}`;
}
