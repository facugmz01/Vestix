/**
 * Utilities for cleaning, normalizing, and resolving product and variant image URLs.
 */

export function sanitizeImageUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Common dirty values produced by broken scripts or bad deserialization
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

export function parseProductImages(images: unknown): string[] {
  if (!images) return [];
  let rawList: unknown[] = [];

  if (Array.isArray(images)) {
    rawList = images;
  } else if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '{}') return [];
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

  const result: string[] = [];
  for (const item of rawList) {
    const clean = sanitizeImageUrl(item);
    if (clean && !result.includes(clean)) {
      result.push(clean);
    }
  }

  return result;
}

export function resolveVariantImageUrl(variantImageUrl?: unknown, productImages?: unknown): string | null {
  const cleanVariant = sanitizeImageUrl(variantImageUrl);
  if (cleanVariant) return cleanVariant;

  const parsedImages = parseProductImages(productImages);
  return parsedImages.length > 0 ? parsedImages[0] : null;
}
