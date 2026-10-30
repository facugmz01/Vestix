/**
 * Normalizes and validates an image URL/path for frontend rendering.
 * Filters out invalid values like "/", "null", "undefined", empty strings,
 * normalizes Windows backslashes, and ensures leading slash for "/uploads/..." paths.
 */
export function normalizeImageUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Reject invalid strings often produced by bad migrations or serialization
  if (
    trimmed === '/' ||
    trimmed === '\\' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === '[object Object]'
  ) {
    return null;
  }

  // Preserve data URLs and remote HTTP/HTTPS URLs
  if (trimmed.startsWith('data:image/') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Normalize Windows backslashes
  let normalized = trimmed.replace(/\\/g, '/');

  // Ensure leading slash for relative uploads or root paths
  if (normalized.startsWith('uploads/')) {
    normalized = `/${normalized}`;
  } else if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

/**
 * Extracts and normalizes the first valid image from a product's images field.
 * Handles arrays, JSON strings, or single URL strings safely.
 */
export function resolveFirstProductImage(images: unknown): string | null {
  if (!images) return null;

  let rawList: unknown[] = [];
  if (Array.isArray(images)) {
    rawList = images;
  } else if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '{}') return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === 'string') {
        rawList = [parsed];
      }
    } catch {
      rawList = [trimmed];
    }
  }

  for (const item of rawList) {
    const clean = normalizeImageUrl(item);
    if (clean) return clean;
  }

  return null;
}

/**
 * Resolves the primary image for a variant or product with fallback logic.
 * Prioritizes the variant's own imageUrl (if valid), falling back to the parent product's images.
 */
export function resolveProductImage(
  variantOrProduct?: {
    imageUrl?: string | null;
    images?: unknown;
    product?: { images?: unknown };
  } | null,
): string | null {
  if (!variantOrProduct) return null;

  const variantImg = normalizeImageUrl(variantOrProduct.imageUrl);
  if (variantImg) return variantImg;

  // Check parent product images (common in variant structures)
  if (variantOrProduct.product?.images) {
    const prodImg = resolveFirstProductImage(variantOrProduct.product.images);
    if (prodImg) return prodImg;
  }

  // Check direct product images (common in Product structures)
  if (variantOrProduct.images) {
    const directImg = resolveFirstProductImage(variantOrProduct.images);
    if (directImg) return directImg;
  }

  return null;
}
