/**
 * Normalizes variant-generation payloads from multiple client formats into
 * a single Record<attributeName, values[]>.
 *
 * Supported shapes:
 * - { attributes: { Color: ['Rojo'], Talle: ['M'] }, basePrice }
 * - { attributes: [{ name: 'Color', values: ['Rojo'] }], basePrice }  (GenerateVariantsDto)
 * - { colors: ['Rojo'], sizes: ['M'], basePrice }                     (legacy frontend)
 */
export function normalizeGenerateAttributes(dto: {
  attributes?: Record<string, string[]> | Array<{ name: string; values: string[] }>;
  colors?: string[];
  sizes?: string[];
}): Record<string, string[]> {
  if (dto.attributes) {
    if (Array.isArray(dto.attributes)) {
      const result: Record<string, string[]> = {};
      for (const attr of dto.attributes) {
        if (attr?.name && Array.isArray(attr.values) && attr.values.length > 0) {
          result[attr.name] = attr.values;
        }
      }
      return result;
    }
    if (typeof dto.attributes === 'object') {
      return Object.fromEntries(
        Object.entries(dto.attributes).filter(([, values]) => Array.isArray(values) && values.length > 0),
      );
    }
  }

  const legacy: Record<string, string[]> = {};
  if (dto.colors?.length) legacy.Color = dto.colors;
  if (dto.sizes?.length) legacy.Talle = dto.sizes;
  return legacy;
}

export function cartesianCombinations(attributes: Record<string, string[]>): Record<string, string>[] {
  const attrNames = Object.keys(attributes);
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

export function extractColorAndSize(combo: Record<string, string>): { color: string | null; size: string | null } {
  const colorKey = Object.keys(combo).find(k =>
    ['color', 'colores', 'cor'].includes(k.toLowerCase()),
  );
  const sizeKey = Object.keys(combo).find(
    k =>
      ['size', 'sizes', 'talle', 'talles', 'talla', 'tallas', 'tamaño', 'tamaños'].includes(k.toLowerCase()) ||
      k.toLowerCase().startsWith('talle'),
  );

  return {
    color: colorKey ? combo[colorKey] : null,
    size: sizeKey ? combo[sizeKey] : null,
  };
}
