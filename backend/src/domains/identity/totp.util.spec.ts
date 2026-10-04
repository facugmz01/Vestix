import {
  generateTotpSecret,
  generateTotpToken,
  verifyTotpToken,
  buildOtpauthUrl,
  generateQrCodeDataUrl,
  generateBackupCodes,
} from './totp.util';

describe('TOTP Utility (RFC 6238)', () => {
  it('should generate a 32-character base32 secret', () => {
    const secret = generateTotpSecret();
    expect(secret).toHaveLength(32);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('should generate a 6-digit TOTP token', () => {
    const secret = generateTotpSecret();
    const token = generateTotpToken(secret);
    expect(token).toHaveLength(6);
    expect(token).toMatch(/^\d{6}$/);
  });

  it('should verify valid TOTP token within current time window', () => {
    const secret = generateTotpSecret();
    const token = generateTotpToken(secret);
    expect(verifyTotpToken(token, secret)).toBe(true);
  });

  it('should verify TOTP token within +/- 30 seconds skew window', () => {
    const secret = generateTotpSecret();
    const pastTime = Date.now() - 25 * 1000;
    const token = generateTotpToken(secret, pastTime);
    expect(verifyTotpToken(token, secret, 1)).toBe(true);
  });

  it('should reject invalid or malformed tokens', () => {
    const secret = generateTotpSecret();
    expect(verifyTotpToken('000000', secret)).toBe(false);
    expect(verifyTotpToken('abc', secret)).toBe(false);
    expect(verifyTotpToken('', secret)).toBe(false);
  });

  it('should generate properly formatted otpauth url', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const url = buildOtpauthUrl('admin@test.com', secret, 'Vestix');
    expect(url).toContain('otpauth://totp/Vestix:admin%40test.com');
    expect(url).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(url).toContain('issuer=Vestix');
  });

  it('should generate a valid QR code data URL', async () => {
    const url = 'otpauth://totp/Vestix:admin%40test.com?secret=JBSWY3DPEHPK3PXP&issuer=Vestix';
    const qr = await generateQrCodeDataUrl(url);
    expect(qr.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('should generate 8 unique alphanumeric backup codes in XXXX-XXXX format', () => {
    const codes = generateBackupCodes(8);
    expect(codes).toHaveLength(8);
    codes.forEach((code) => {
      expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    });
    const unique = new Set(codes);
    expect(unique.size).toBe(8);
  });
});
