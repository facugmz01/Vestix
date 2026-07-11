export interface EnrichedOrderLine {
  id: string;
  variantId: string;
  quantity: number;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  historicalName?: string | null;
  historicalSku?: string | null;
  productName: string;
  variantSku: string | null;
  size: string | null;
}

type RawOrderLine = {
  id: string;
  variantId: string;
  quantity: number;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  historicalName?: string | null;
  historicalSku?: string | null;
};

type VariantDetail = {
  id: string;
  sku?: string | null;
  size?: string | null;
  product?: { name?: string | null } | null;
};

export function enrichOrderLines(
  lines: RawOrderLine[],
  variants: VariantDetail[],
): EnrichedOrderLine[] {
  const variantMap = new Map(variants.map(v => [v.id, v]));

  return lines.map(line => {
    const variant = variantMap.get(line.variantId);
    return {
      ...line,
      productName: line.historicalName || variant?.product?.name || 'Producto',
      variantSku: line.historicalSku || variant?.sku || null,
      size: variant?.size || null,
    };
  });
}
