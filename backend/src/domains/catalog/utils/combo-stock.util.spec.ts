import { expandComboToStockMovements } from './combo-stock.util';

describe('expandComboToStockMovements', () => {
  it('returns the line variant for non-combo products', () => {
    const result = expandComboToStockMovements(
      { product: { type: 'SINGLE', comboLines: [] } },
      'variant-a',
      3,
    );
    expect(result).toEqual([{ variantId: 'variant-a', quantity: 3 }]);
  });

  it('expands combo products into child variant movements', () => {
    const result = expandComboToStockMovements(
      {
        product: {
          type: 'COMBO',
          comboLines: [
            { childVariantId: 'child-1', quantity: 2 },
            { childVariantId: 'child-2', quantity: 1 },
          ],
        },
      },
      'combo-variant',
      3,
    );
    expect(result).toEqual([
      { variantId: 'child-1', quantity: 6 },
      { variantId: 'child-2', quantity: 3 },
    ]);
  });

  it('falls back to line variant when combo has no lines', () => {
    const result = expandComboToStockMovements(
      { product: { type: 'COMBO', comboLines: [] } },
      'combo-variant',
      2,
    );
    expect(result).toEqual([{ variantId: 'combo-variant', quantity: 2 }]);
  });

  it('handles missing product data', () => {
    expect(expandComboToStockMovements(null, 'variant-x', 1)).toEqual([
      { variantId: 'variant-x', quantity: 1 },
    ]);
  });
});
