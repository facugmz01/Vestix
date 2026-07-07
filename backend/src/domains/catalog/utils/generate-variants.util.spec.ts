import {
  normalizeGenerateAttributes,
  cartesianCombinations,
  extractColorAndSize,
} from './generate-variants.util';

describe('generate-variants.util', () => {
  describe('normalizeGenerateAttributes', () => {
    it('accepts attributes as Record', () => {
      expect(
        normalizeGenerateAttributes({
          attributes: { Color: ['Rojo'], Talle: ['M', 'L'] },
        }),
      ).toEqual({ Color: ['Rojo'], Talle: ['M', 'L'] });
    });

    it('accepts attributes as array (GenerateVariantsDto)', () => {
      expect(
        normalizeGenerateAttributes({
          attributes: [
            { name: 'Color', values: ['Azul'] },
            { name: 'Talle', values: ['S'] },
          ],
        }),
      ).toEqual({ Color: ['Azul'], Talle: ['S'] });
    });

    it('accepts legacy colors/sizes format', () => {
      expect(
        normalizeGenerateAttributes({
          colors: ['Rojo', 'Azul'],
          sizes: ['M'],
        }),
      ).toEqual({ Color: ['Rojo', 'Azul'], Talle: ['M'] });
    });

    it('returns empty object when no attributes provided', () => {
      expect(normalizeGenerateAttributes({})).toEqual({});
    });
  });

  describe('cartesianCombinations', () => {
    it('builds all permutations', () => {
      const combos = cartesianCombinations({ Color: ['Rojo'], Talle: ['S', 'M'] });
      expect(combos).toHaveLength(2);
      expect(combos).toEqual(
        expect.arrayContaining([
          { Color: 'Rojo', Talle: 'S' },
          { Color: 'Rojo', Talle: 'M' },
        ]),
      );
    });
  });

  describe('extractColorAndSize', () => {
    it('maps Spanish attribute names', () => {
      expect(extractColorAndSize({ Color: 'Rojo', Talle: 'M' })).toEqual({
        color: 'Rojo',
        size: 'M',
      });
    });
  });
});
