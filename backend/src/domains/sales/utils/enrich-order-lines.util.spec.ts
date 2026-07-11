import { enrichOrderLines } from './enrich-order-lines.util';

describe('enrichOrderLines', () => {
  const baseLine = {
    id: 'line-1',
    variantId: 'variant-1',
    quantity: 1,
    basePrice: 10000,
    discountAmount: 0,
    finalPrice: 10000,
    historicalName: null,
    historicalSku: null,
  };

  it('prefers historicalName over live catalog name', () => {
    const result = enrichOrderLines(
      [{ ...baseLine, historicalName: 'Remera Histórica', historicalSku: 'REM-01' }],
      [{ id: 'variant-1', sku: 'LIVE-SKU', size: 'M', product: { name: 'Remera Live' } }],
    );

    expect(result[0].productName).toBe('Remera Histórica');
    expect(result[0].variantSku).toBe('REM-01');
    expect(result[0].size).toBe('M');
  });

  it('falls back to catalog name when historicalName is missing', () => {
    const result = enrichOrderLines(
      [baseLine],
      [{ id: 'variant-1', sku: 'PANT-01', size: 'L', product: { name: 'Pantalón' } }],
    );

    expect(result[0].productName).toBe('Pantalón');
    expect(result[0].variantSku).toBe('PANT-01');
  });

  it('uses "Producto" when no name is available', () => {
    const result = enrichOrderLines([baseLine], []);

    expect(result[0].productName).toBe('Producto');
    expect(result[0].variantSku).toBeNull();
  });
});
