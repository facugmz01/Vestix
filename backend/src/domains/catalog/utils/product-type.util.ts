export type ProductTypeValue = 'SINGLE' | 'VARIABLE' | 'COMBO';

export function isVariableProduct(input: { type?: ProductTypeValue | string; isVariable?: boolean }): boolean {
  if (input.type === 'VARIABLE') return true;
  return !!input.isVariable;
}

export function normalizeProductType(input: { type?: ProductTypeValue | string; isVariable?: boolean }): ProductTypeValue {
  if (input.type === 'COMBO') return 'COMBO';
  if (isVariableProduct(input)) return 'VARIABLE';
  return 'SINGLE';
}

export function syncIsVariableFlag(type: ProductTypeValue): boolean {
  return type === 'VARIABLE';
}
