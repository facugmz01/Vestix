export class BarcodeGeneratorUtil {
  /**
   * Generates a valid 13-digit EAN-13 barcode specifically for internal store use.
   * Format: Prefix (2-3) + Company (4-5) + Item (4-5) + Check Digit (1)
   * The GS1 standard reserves prefixes '02' and '04' for internal distribution.
   */
  static generateInternalEan13(itemCodeSeed: number): string {
    const prefix = '04'; // Strictly internal use, will not conflict with global retail items
    const company = '0000'; // Default internal company routing code
    
    // Ensure item code is exactly 6 digits
    const itemCode = itemCodeSeed.toString().padStart(6, '0').slice(-6);
    
    const barcodeWithoutCheck = `${prefix}${company}${itemCode}`;
    const checkDigit = this.calculateEan13CheckDigit(barcodeWithoutCheck);
    
    return `${barcodeWithoutCheck}${checkDigit}`;
  }

  /**
   * Calculates the standard GS1 EAN-13 check digit modulo 10 algorithm.
   */
  static calculateEan13CheckDigit(barcode12: string): string {
    if (barcode12.length !== 12) {
      throw new Error('EAN-13 base must be exactly 12 digits before calculating check digit');
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode12[i], 10);
      // Even index (1-based odd) * 1, Odd index (1-based even) * 3
      sum += (i % 2 === 0) ? digit : digit * 3; 
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    
    return checkDigit.toString();
  }
  
  /**
   * Validates an EAN-13 string to prevent POS hardware scanner rejection.
   */
  static isValidEan13(barcode: string): boolean {
    if (!/^\d{13}$/.test(barcode)) return false;
    
    const base = barcode.substring(0, 12);
    const providedCheckDigit = barcode.substring(12, 13);
    const calculatedCheckDigit = this.calculateEan13CheckDigit(base);
    
    return providedCheckDigit === calculatedCheckDigit;
  }
}
