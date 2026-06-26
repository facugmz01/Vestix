import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV recommended for GCM
const TAG_LENGTH = 16;  // 128-bit auth tag
const ENC_PREFIX = 'enc:';

/**
 * EncryptionService — AES-256-GCM symmetric encryption for sensitive config values.
 *
 * Key must be 32 bytes (256 bits) stored in the SETTINGS_ENCRYPTION_KEY env var
 * as a base64-encoded string.
 *
 * Generate key: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Encrypted format: enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;
  private readonly enabled: boolean;

  constructor() {
    const raw = process.env.SETTINGS_ENCRYPTION_KEY;
    if (!raw) {
      this.logger.warn(
        'SETTINGS_ENCRYPTION_KEY is not set. Sensitive settings fields will NOT be encrypted. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
      );
      this.enabled = false;
      this.key = Buffer.alloc(32); // dummy key — encryption disabled
    } else {
      this.key = Buffer.from(raw, 'base64');
      if (this.key.length !== 32) {
        throw new Error(
          `SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes (256 bits). Got ${this.key.length} bytes.`,
        );
      }
      this.enabled = true;
    }
  }

  /**
   * Encrypts a plaintext string.
   * Returns the encrypted string prefixed with 'enc:'.
   * If encryption is disabled or the value is empty/already encrypted, returns as-is.
   */
  encrypt(plaintext: string): string {
    if (!this.enabled || !plaintext || plaintext.startsWith(ENC_PREFIX)) {
      return plaintext;
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENC_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts an encrypted string (must start with 'enc:').
   * Returns plaintext. If the value is not encrypted, returns as-is.
   */
  decrypt(value: string): string {
    if (!value || !value.startsWith(ENC_PREFIX)) {
      return value;
    }
    if (!this.enabled) {
      this.logger.warn('Encrypted value found but SETTINGS_ENCRYPTION_KEY is not configured. Returning raw value.');
      return value;
    }
    try {
      const [, ivHex, tagHex, ctHex] = value.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const ct = Buffer.from(ctHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_LENGTH });
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    } catch (err: any) {
      this.logger.error(`Failed to decrypt value: ${err.message}`);
      return ''; // Return empty rather than crashing the app
    }
  }

  /** Returns true if the value is encrypted. */
  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith(ENC_PREFIX);
  }

  /** Returns true if encryption is configured and enabled. */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Masks a sensitive value for safe display in API responses.
   * Returns '••••••••' if the value is non-empty, '' otherwise.
   */
  mask(value: string | undefined | null): string {
    if (!value || value === '') return '';
    return '••••••••';
  }
}
