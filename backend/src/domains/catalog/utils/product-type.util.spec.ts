import { isVariableProduct, normalizeProductType, syncIsVariableFlag } from './product-type.util';

describe('product-type.util', () => {
  it('detects variable products from type', () => {
    expect(isVariableProduct({ type: 'VARIABLE' })).toBe(true);
    expect(isVariableProduct({ type: 'SINGLE' })).toBe(false);
  });

  it('detects variable products from legacy isVariable flag', () => {
    expect(isVariableProduct({ isVariable: true })).toBe(true);
  });

  it('normalizes product type', () => {
    expect(normalizeProductType({ type: 'VARIABLE' })).toBe('VARIABLE');
    expect(normalizeProductType({ isVariable: true })).toBe('VARIABLE');
    expect(syncIsVariableFlag('VARIABLE')).toBe(true);
  });
});
