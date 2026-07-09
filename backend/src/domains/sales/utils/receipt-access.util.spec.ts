import { generateReceiptAccessToken, verifyReceiptAccessToken, buildPublicReceiptUrl } from './receipt-access.util';

describe('receipt-access.util', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('generates a stable token for an order', () => {
    const tokenA = generateReceiptAccessToken('order-1');
    const tokenB = generateReceiptAccessToken('order-1');
    expect(tokenA).toBe(tokenB);
    expect(tokenA).toHaveLength(32);
  });

  it('verifies valid and invalid tokens', () => {
    const token = generateReceiptAccessToken('order-1');
    expect(verifyReceiptAccessToken('order-1', token)).toBe(true);
    expect(verifyReceiptAccessToken('order-1', 'invalid-token')).toBe(false);
    expect(verifyReceiptAccessToken('order-2', token)).toBe(false);
  });

  it('builds a public receipt URL with token', () => {
    const url = buildPublicReceiptUrl('order-1', 'https://app.example.com');
    expect(url).toMatch(/^https:\/\/app\.example\.com\/comprobante\/order-1\?t=[a-f0-9]{32}$/);
  });
});
