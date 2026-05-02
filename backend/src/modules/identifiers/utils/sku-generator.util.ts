export class SkuGeneratorUtil {
  /**
   * Generates a base SKU from a category and product name.
   * e.g. Category: 'T-Shirts', Name: 'Basic Crewneck' -> TSH-BASC
   */
  static generateBaseSku(categoryCode: string, productName: string, randomSuffix: boolean = false): string {
    // Extract first 3 letters of category, first 4 of product, alphanumeric only
    const cat = categoryCode.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const prod = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    
    if (randomSuffix) {
      const rnd = Math.floor(100 + Math.random() * 900).toString(); // 3 digit random
      return `${cat}-${prod}-${rnd}`;
    }
    
    return `${cat}-${prod}`;
  }

  /**
   * Appends variant traits to a base SKU deterministically (alphabetical key order).
   * e.g. TSH-BASC + { Size: 'L', Color: 'RED' } -> TSH-BASC-RED-L
   */
  static generateVariantSku(baseSku: string, attributes: Record<string, string>): string {
    const sortedKeys = Object.keys(attributes).sort();
    let suffix = '';

    for (const key of sortedKeys) {
      // Clean special characters and take first 3 chars
      const val = attributes[key].toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      suffix += `-${val}`;
    }

    return `${baseSku}${suffix}`;
  }
}
