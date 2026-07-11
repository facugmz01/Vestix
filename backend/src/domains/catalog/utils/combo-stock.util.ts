export interface ComboLineInput {
  childVariantId: string;
  quantity: number;
}

export interface VariantWithComboProduct {
  product?: {
    type?: string;
    comboLines?: ComboLineInput[];
  } | null;
}

/**
 * Expands a sale line into stock movements. COMBO products deduct component variants.
 */
export function expandComboToStockMovements(
  variantWithProduct: VariantWithComboProduct | null | undefined,
  lineVariantId: string,
  lineQuantity: number,
): Array<{ variantId: string; quantity: number }> {
  if (
    variantWithProduct?.product?.type === 'COMBO' &&
    variantWithProduct.product.comboLines?.length
  ) {
    return variantWithProduct.product.comboLines.map((cl) => ({
      variantId: cl.childVariantId,
      quantity: lineQuantity * cl.quantity,
    }));
  }

  return [{ variantId: lineVariantId, quantity: lineQuantity }];
}
