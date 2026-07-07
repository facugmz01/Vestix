import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';

export interface VariantStockSummary {
  variantId: string;
  availableQuantity: number;
  physicalQuantity: number;
  reservedQuantity: number;
}

export function useVariantStockMap(variantIds: string[]) {
  const sortedKey = [...variantIds].sort().join(',');

  const query = useQuery({
    queryKey: ['variant-stock-summary', sortedKey],
    queryFn: () => inventoryApi.getStockSummary(variantIds),
    enabled: variantIds.length > 0,
    staleTime: 30_000,
  });

  const stockMap = new Map<string, VariantStockSummary>(
    (query.data ?? []).map(item => [item.variantId, item]),
  );

  return { stockMap, ...query };
}
