export type VariantCombinationDraft = {
  color?: string;
  size?: string;
  attributes: Record<string, string>;
  costPrice: number;
  basePrice: number;
  isActive: boolean;
  sku: string;
};

export function cartesianCombinations(
  attributes: Record<string, string[]>,
): Record<string, string>[] {
  const attrNames = Object.keys(attributes).filter(k => attributes[k]?.length > 0);
  if (attrNames.length === 0) return [];

  let combinations: Record<string, string>[] = [{}];

  for (const name of attrNames) {
    const next: Record<string, string>[] = [];
    for (const value of attributes[name]) {
      for (const combo of combinations) {
        next.push({ ...combo, [name]: value });
      }
    }
    combinations = next;
  }

  return combinations;
}

export function extractColorAndSize(combo: Record<string, string>): {
  color?: string;
  size?: string;
} {
  const colorKey = Object.keys(combo).find(k =>
    ['color', 'colores', 'cor'].includes(k.toLowerCase()),
  );
  const sizeKey = Object.keys(combo).find(
    k =>
      ['size', 'sizes', 'talle', 'talles', 'talla', 'tallas', 'tamaño', 'tamaños'].includes(
        k.toLowerCase(),
      ) || k.toLowerCase().startsWith('talle'),
  );

  return {
    color: colorKey ? combo[colorKey] : undefined,
    size: sizeKey ? combo[sizeKey] : undefined,
  };
}

export function buildVariantDrafts(
  attributes: Record<string, string[]>,
  costPrice: number,
  basePrice: number,
): VariantCombinationDraft[] {
  return cartesianCombinations(attributes).map(combo => {
    const { color, size } = extractColorAndSize(combo);
    return {
      color,
      size,
      attributes: combo,
      costPrice,
      basePrice,
      isActive: true,
      sku: '',
    };
  });
}

export function countCombinations(attributes: Record<string, string[]>): number {
  const names = Object.keys(attributes).filter(k => attributes[k]?.length > 0);
  if (names.length === 0) return 0;
  return names.reduce((total, name) => total * attributes[name].length, 1);
}
