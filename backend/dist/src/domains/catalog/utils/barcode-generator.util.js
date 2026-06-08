"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarcodeGeneratorUtil = void 0;
class BarcodeGeneratorUtil {
    static generateInternalEan13(itemCodeSeed) {
        const prefix = '04';
        const company = '0000';
        const itemCode = itemCodeSeed.toString().padStart(6, '0').slice(-6);
        const barcodeWithoutCheck = `${prefix}${company}${itemCode}`;
        const checkDigit = this.calculateEan13CheckDigit(barcodeWithoutCheck);
        return `${barcodeWithoutCheck}${checkDigit}`;
    }
    static calculateEan13CheckDigit(barcode12) {
        if (barcode12.length !== 12) {
            throw new Error('EAN-13 base must be exactly 12 digits before calculating check digit');
        }
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode12[i], 10);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const remainder = sum % 10;
        const checkDigit = remainder === 0 ? 0 : 10 - remainder;
        return checkDigit.toString();
    }
    static isValidEan13(barcode) {
        if (!/^\d{13}$/.test(barcode))
            return false;
        const base = barcode.substring(0, 12);
        const providedCheckDigit = barcode.substring(12, 13);
        const calculatedCheckDigit = this.calculateEan13CheckDigit(base);
        return providedCheckDigit === calculatedCheckDigit;
    }
}
exports.BarcodeGeneratorUtil = BarcodeGeneratorUtil;
//# sourceMappingURL=barcode-generator.util.js.map