import { extractShippingDimensions, hasRequiredShippingDimensions, normalizeMetadataWithDimensions } from './shipping-dimensions.util';

describe('shipping-dimensions.util', () => {
  it('reads nested dimensions', () => {
    const dims = extractShippingDimensions({
      dimensions: { weight: 1, width: 2, height: 3, length: 4 },
    });
    expect(dims.depth).toBe(4);
    expect(hasRequiredShippingDimensions({ dimensions: dims })).toBe(true);
  });

  it('reads flat legacy dimensions', () => {
    expect(hasRequiredShippingDimensions({ weight: 1, width: 2, height: 3, depth: 4 })).toBe(true);
  });

  it('normalizes metadata shape', () => {
    const normalized = normalizeMetadataWithDimensions({
      dimensions: { weight: '1', width: '2', height: '3', length: '4' },
    });
    expect(normalized.dimensions.depth).toBe('4');
  });
});
