import { SkuGeneratorUtil } from './sku-generator.util';

describe('SkuGeneratorUtil', () => {
  describe('generateBaseSku', () => {
    it('generates base SKU from category and product name', () => {
      expect(SkuGeneratorUtil.generateBaseSku('T-Shirts', 'Basic Crewneck')).toBe('TSH-BASI');
    });

    it('generates base SKU with random 3-digit suffix when requested', () => {
      const sku = SkuGeneratorUtil.generateBaseSku('Pantalones', 'Jean Slim', true);
      expect(sku).toMatch(/^PAN-JEAN-\d{3}$/);
    });

    it('handles null/empty gracefully', () => {
      expect(SkuGeneratorUtil.generateBaseSku('', '')).toBe('CAT-PROD');
    });
  });

  describe('formatAttributeTrait', () => {
    it('normalizes diacritics / accents in Spanish', () => {
      expect(SkuGeneratorUtil.formatAttributeTrait('Marrón')).toBe('MAR');
      expect(SkuGeneratorUtil.formatAttributeTrait('Bordó')).toBe('BOR');
      expect(SkuGeneratorUtil.formatAttributeTrait('Índigo')).toBe('IND');
      expect(SkuGeneratorUtil.formatAttributeTrait('Ónix')).toBe('ONI');
      expect(SkuGeneratorUtil.formatAttributeTrait('Ámbar')).toBe('AMB');
      expect(SkuGeneratorUtil.formatAttributeTrait('Ñandú')).toBe('NAN');
    });

    it('compacts compound colors into clean 3-char initials', () => {
      expect(SkuGeneratorUtil.formatAttributeTrait('Azul Marino')).toBe('AZM');
      expect(SkuGeneratorUtil.formatAttributeTrait('Azul Francia')).toBe('AZF');
      expect(SkuGeneratorUtil.formatAttributeTrait('Azul Noche')).toBe('AZN');
      expect(SkuGeneratorUtil.formatAttributeTrait('Gris Melange')).toBe('GRM');
      expect(SkuGeneratorUtil.formatAttributeTrait('Verde Militar')).toBe('VEM');
      expect(SkuGeneratorUtil.formatAttributeTrait('Rosa Viejo')).toBe('ROV');
    });

    it('preserves clothing size values up to 4 characters', () => {
      expect(SkuGeneratorUtil.formatAttributeTrait('S', true)).toBe('S');
      expect(SkuGeneratorUtil.formatAttributeTrait('M', true)).toBe('M');
      expect(SkuGeneratorUtil.formatAttributeTrait('L', true)).toBe('L');
      expect(SkuGeneratorUtil.formatAttributeTrait('XL', true)).toBe('XL');
      expect(SkuGeneratorUtil.formatAttributeTrait('XXL', true)).toBe('XXL');
      expect(SkuGeneratorUtil.formatAttributeTrait('XXXL', true)).toBe('XXXL');
      expect(SkuGeneratorUtil.formatAttributeTrait('4XL', true)).toBe('4XL');
      expect(SkuGeneratorUtil.formatAttributeTrait('38', true)).toBe('38');
      expect(SkuGeneratorUtil.formatAttributeTrait('41.5', true)).toBe('415');
    });

    it('returns empty string for null, undefined or empty strings', () => {
      expect(SkuGeneratorUtil.formatAttributeTrait(null)).toBe('');
      expect(SkuGeneratorUtil.formatAttributeTrait(undefined)).toBe('');
      expect(SkuGeneratorUtil.formatAttributeTrait('')).toBe('');
      expect(SkuGeneratorUtil.formatAttributeTrait('   ')).toBe('');
      expect(SkuGeneratorUtil.formatAttributeTrait('---')).toBe('');
    });
  });

  describe('generateVariantSku', () => {
    it('appends color and size in canonical deterministic order', () => {
      expect(
        SkuGeneratorUtil.generateVariantSku('TSH-BASC', { Size: 'L', Color: 'RED' }),
      ).toBe('TSH-BASC-RED-L');
      expect(
        SkuGeneratorUtil.generateVariantSku('TSH-BASC', { Talle: 'M', Color: 'Rojo' }),
      ).toBe('TSH-BASC-ROJ-M');
    });

    it('sorts keys case-insensitively with Color first and Size second', () => {
      // Regardless of key casing or insertion order, Color is first, Size is second
      expect(
        SkuGeneratorUtil.generateVariantSku('TSH-BASC', { talle: 'M', color: 'Rojo' }),
      ).toBe('TSH-BASC-ROJ-M');
      expect(
        SkuGeneratorUtil.generateVariantSku('TSH-BASC', { size: 'XL', Color: 'Azul' }),
      ).toBe('TSH-BASC-AZU-XL');
    });

    it('handles Spanish accents and compound colors without collision', () => {
      expect(
        SkuGeneratorUtil.generateVariantSku('PROD', { Color: 'Azul Marino', Talle: 'XXXL' }),
      ).toBe('PROD-AZM-XXXL');
      expect(
        SkuGeneratorUtil.generateVariantSku('PROD', { Color: 'Azul Francia', Talle: 'XXXL' }),
      ).toBe('PROD-AZF-XXXL');
      expect(
        SkuGeneratorUtil.generateVariantSku('PROD', { Color: 'Índigo', Talle: '42' }),
      ).toBe('PROD-IND-42');
    });

    it('appends additional attributes alphabetically after color and size', () => {
      expect(
        SkuGeneratorUtil.generateVariantSku('PROD', {
          Material: 'Algodón',
          Color: 'Negro',
          Talle: 'M',
        }),
      ).toBe('PROD-NEG-M-ALG');
    });

    it('is resilient to null, undefined, and empty attribute values', () => {
      expect(
        SkuGeneratorUtil.generateVariantSku('PROD', {
          Color: null,
          Talle: 'S',
          Empty: '',
        }),
      ).toBe('PROD-S');

      expect(SkuGeneratorUtil.generateVariantSku('PROD', {})).toBe('PROD');
      expect(SkuGeneratorUtil.generateVariantSku('', { Color: 'Rojo' })).toBe('PROD-ROJ');
    });
  });
});
