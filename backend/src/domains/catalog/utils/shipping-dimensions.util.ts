export interface ShippingDimensions {
  weight?: number | string;
  width?: number | string;
  height?: number | string;
  depth?: number | string;
  length?: number | string;
}

export function extractShippingDimensions(metadata: Record<string, any> | null | undefined): ShippingDimensions {
  if (!metadata) return {};
  const nested = metadata.dimensions || {};
  return {
    weight: metadata.weight ?? nested.weight,
    width: metadata.width ?? nested.width,
    height: metadata.height ?? nested.height,
    depth: metadata.depth ?? nested.depth ?? nested.length ?? metadata.length,
    length: metadata.length ?? nested.length,
  };
}

export function hasRequiredShippingDimensions(metadata: Record<string, any> | null | undefined): boolean {
  const dims = extractShippingDimensions(metadata);
  return !!(dims.weight && dims.width && dims.height && (dims.depth || dims.length));
}

export function normalizeMetadataWithDimensions(metadata: Record<string, any> = {}): Record<string, any> {
  const dims = extractShippingDimensions(metadata);
  const depth = dims.depth ?? dims.length;
  return {
    ...metadata,
    dimensions: {
      weight: dims.weight,
      width: dims.width,
      height: dims.height,
      depth,
      length: dims.length ?? depth,
    },
  };
}
