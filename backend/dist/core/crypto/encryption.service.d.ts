export declare class EncryptionService {
    private readonly logger;
    private readonly key;
    private readonly enabled;
    constructor();
    encrypt(plaintext: string): string;
    decrypt(value: string): string;
    isEncrypted(value: string): boolean;
    isEnabled(): boolean;
    mask(value: string | undefined | null): string;
}
