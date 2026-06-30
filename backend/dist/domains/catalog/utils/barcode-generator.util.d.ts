export declare class BarcodeGeneratorUtil {
    static generateInternalEan13(itemCodeSeed: number): string;
    static calculateEan13CheckDigit(barcode12: string): string;
    static isValidEan13(barcode: string): boolean;
}
