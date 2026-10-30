import {
  sanitizeImageUrl,
  parseProductImages,
  resolveVariantImageUrl,
} from './product-image.util';

describe('product-image.util', () => {
  describe('sanitizeImageUrl', () => {
    it('returns null for null, undefined, empty, or whitespace', () => {
      expect(sanitizeImageUrl(null)).toBeNull();
      expect(sanitizeImageUrl(undefined)).toBeNull();
      expect(sanitizeImageUrl('')).toBeNull();
      expect(sanitizeImageUrl('   ')).toBeNull();
    });

    it('rejects rogue values like "/", "null", "undefined"', () => {
      expect(sanitizeImageUrl('/')).toBeNull();
      expect(sanitizeImageUrl('\\')).toBeNull();
      expect(sanitizeImageUrl('null')).toBeNull();
      expect(sanitizeImageUrl('undefined')).toBeNull();
      expect(sanitizeImageUrl('[object Object]')).toBeNull();
    });

    it('normalizes Windows backslashes and missing leading slash', () => {
      expect(sanitizeImageUrl('uploads\\products\\image.png')).toBe('/uploads/products/image.png');
      expect(sanitizeImageUrl('uploads/products/image.png')).toBe('/uploads/products/image.png');
      expect(sanitizeImageUrl('/uploads/products/image.png')).toBe('/uploads/products/image.png');
    });

    it('preserves data URLs and absolute HTTP URLs', () => {
      expect(sanitizeImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
      expect(sanitizeImageUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
    });
  });

  describe('parseProductImages', () => {
    it('handles arrays and filters invalid entries', () => {
      expect(parseProductImages(['/uploads/products/1.png', '/', '   ', null, 'uploads/products/2.png'])).toEqual([
        '/uploads/products/1.png',
        '/uploads/products/2.png',
      ]);
    });

    it('handles stringified JSON arrays', () => {
      const json = JSON.stringify(['/uploads/products/1.png', 'uploads\\products\\2.jpg']);
      expect(parseProductImages(json)).toEqual(['/uploads/products/1.png', '/uploads/products/2.jpg']);
    });

    it('handles empty or broken JSON string safely', () => {
      expect(parseProductImages('[]')).toEqual([]);
      expect(parseProductImages('')).toEqual([]);
      expect(parseProductImages('null')).toEqual([]);
    });
  });

  describe('resolveVariantImageUrl', () => {
    it('prioritizes valid variant imageUrl', () => {
      expect(
        resolveVariantImageUrl('/uploads/products/var.png', ['/uploads/products/prod.png']),
      ).toBe('/uploads/products/var.png');
    });

    it('falls back to product images when variant imageUrl is "/" or invalid', () => {
      expect(
        resolveVariantImageUrl('/', ['/uploads/products/prod.png']),
      ).toBe('/uploads/products/prod.png');

      expect(
        resolveVariantImageUrl('null', ['/uploads/products/prod.png']),
      ).toBe('/uploads/products/prod.png');

      expect(
        resolveVariantImageUrl(null, ['/uploads/products/prod.png']),
      ).toBe('/uploads/products/prod.png');
    });

    it('returns null if neither variant nor product has a valid image', () => {
      expect(resolveVariantImageUrl('/', ['/', ''])).toBeNull();
      expect(resolveVariantImageUrl(null, null)).toBeNull();
    });
  });
});
