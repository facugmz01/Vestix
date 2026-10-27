export class SkuGeneratorUtil {
  /**
   * Generates a base SKU from a category and product name.
   * e.g. Category: 'T-Shirts', Name: 'Basic Crewneck' -> TSH-BASC
   */
  static generateBaseSku(categoryCode: string, productName: string, randomSuffix: boolean = false): string {
    const cat = this.cleanAlphanumeric(categoryCode || 'CAT').substring(0, 3) || 'CAT';
    const prod = this.cleanAlphanumeric(productName || 'PROD').substring(0, 4) || 'PROD';
    
    if (randomSuffix) {
      const rnd = Math.floor(100 + Math.random() * 900).toString(); // 3 digit random
      return `${cat}-${prod}-${rnd}`;
    }
    
    return `${cat}-${prod}`;
  }

  /**
   * Formats a single variant trait value into a compact, normalized code.
   * - Decomposes and removes accents/diacritics: Índigo -> IND, Marrón -> MAR, Bordó -> BOR.
   * - Preserves size attributes up to 4 characters: XXXL -> XXXL, 4XL -> 4XL, 41.5 -> 415.
   * - Compacts compound colors/traits meaningfully: Azul Marino -> AZM, Gris Melange -> GRM.
   * - Returns empty string for null, undefined or empty inputs.
   */
  static formatAttributeTrait(val: unknown, isSize: boolean = false): string {
    if (val == null) return '';
    const str = String(val).trim();
    if (!str) return '';

    // Remove diacritics / accents (e.g. 'Í' -> 'I', 'ó' -> 'o', 'ñ' -> 'n')
    const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Size / Talle traits (e.g. S, M, L, XL, XXL, XXXL, 4XL, 38, 40, 42, 41.5)
    if (isSize) {
      const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return cleaned.substring(0, 4);
    }

    // Compound traits (e.g. "Azul Marino", "Verde Militar", "Gris Topo")
    const words = normalized.split(/[\s\-_/]+/).filter(w => w.trim().length > 0);
    if (words.length >= 2) {
      const w1 = words[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const w2 = words[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (w1.length >= 2 && w2.length >= 1) {
        return `${w1.substring(0, 2)}${w2.substring(0, 1)}`;
      }
    }

    // Standard single-word traits: first 3 alphanumeric chars
    const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return cleaned.substring(0, 3);
  }

  /**
   * Checks whether an attribute key corresponds to a size/talle trait.
   */
  static isSizeAttributeKey(key: string): boolean {
    const k = (key || '').toLowerCase().trim();
    return (
      ['size', 'sizes', 'talle', 'talles', 'talla', 'tallas', 'tamano', 'tamanos'].includes(k) ||
      k.startsWith('talle')
    );
  }

  /**
   * Checks whether an attribute key corresponds to a color trait.
   */
  static isColorAttributeKey(key: string): boolean {
    const k = (key || '').toLowerCase().trim();
    return ['color', 'colores', 'cor'].includes(k);
  }

  /**
   * Appends variant traits to a base SKU deterministically:
   * 1. Color trait first (if present)
   * 2. Size / Talle trait second (if present)
   * 3. Any additional attributes sorted alphabetically (case-insensitive)
   *
   * e.g. TSH-BASC + { Size: 'L', Color: 'RED' } -> TSH-BASC-RED-L
   * e.g. TSH-BASC + { Talle: 'XXXL', Color: 'Azul Marino' } -> TSH-BASC-AZM-XXXL
   */
  static generateVariantSku(baseSku: string, attributes: Record<string, any>): string {
    const cleanBase = (baseSku || 'PROD').trim() || 'PROD';
    if (!attributes || typeof attributes !== 'object') {
      return cleanBase;
    }

    // Filter valid keys that have non-empty values
    const validKeys = Object.keys(attributes).filter(k => {
      const v = attributes[k];
      return v != null && String(v).trim() !== '';
    });

    if (validKeys.length === 0) {
      return cleanBase;
    }

    // Sort keys deterministically: Color first, Size second, remainder alphabetically case-insensitive
    const sortedKeys = [...validKeys].sort((a, b) => {
      const aIsColor = this.isColorAttributeKey(a);
      const bIsColor = this.isColorAttributeKey(b);
      if (aIsColor && !bIsColor) return -1;
      if (!aIsColor && bIsColor) return 1;

      const aIsSize = this.isSizeAttributeKey(a);
      const bIsSize = this.isSizeAttributeKey(b);
      if (aIsSize && !bIsSize) return -1;
      if (!aIsSize && bIsSize) return 1;

      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    const traits: string[] = [];
    for (const key of sortedKeys) {
      const isSize = this.isSizeAttributeKey(key);
      const traitCode = this.formatAttributeTrait(attributes[key], isSize);
      if (traitCode) {
        traits.push(traitCode);
      }
    }

    return traits.length > 0 ? `${cleanBase}-${traits.join('-')}` : cleanBase;
  }

  private static cleanAlphanumeric(val: string): string {
    return (val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  }
}
