import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/api/pos.api';
import { CatalogSyncService } from '@/core/sync/CatalogSyncService';
import type { ProductVariant } from '@/types';

type PosVariant = ProductVariant & {
  name?: string;
  productName?: string;
  category?: string;
  brand?: string;
  stock?: number;
  imageUrl?: string | null;
};

function toVariants(items: Awaited<ReturnType<typeof CatalogSyncService.searchOffline>>): PosVariant[] {
  return items.map(item => CatalogSyncService.toProductVariant(item) as PosVariant);
}

export function usePosOffline(
  branchId: string,
  selectedCustomerId: string,
  search: string,
  isOnline: boolean,
) {
  const queryClient = useQueryClient();

  const { data: gridProducts, isLoading: gridLoading } = useQuery({
    queryKey: ['pos', 'gridProducts', selectedCustomerId, isOnline],
    queryFn: async () => {
      if (isOnline) {
        return posApi.searchProduct('', selectedCustomerId || undefined);
      }
      const offline = await CatalogSyncService.getAllForGrid();
      return toVariants(offline);
    },
    staleTime: isOnline ? 30_000 : 60_000,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['pos', 'search', search, selectedCustomerId, isOnline],
    queryFn: async () => {
      if (isOnline) {
        return posApi.searchProduct(search, selectedCustomerId || undefined);
      }
      const offline = await CatalogSyncService.searchOffline(search, 20);
      return toVariants(offline);
    },
    enabled: search.length >= 2 || (!isOnline && search.length >= 1),
    staleTime: 5_000,
  });

  const lookupBarcode = useCallback(async (code: string): Promise<PosVariant[]> => {
    if (isOnline) {
      try {
        return await posApi.searchProduct(code, selectedCustomerId || undefined);
      } catch {
        // fall through to offline
      }
    }
    const item = await CatalogSyncService.findByBarcodeOrSku(code);
    if (item) return [CatalogSyncService.toProductVariant(item) as PosVariant];
    const partial = await CatalogSyncService.searchOffline(code, 10);
    return toVariants(partial);
  }, [isOnline, selectedCustomerId]);

  const refreshCatalog = useCallback(async (forceFull = false) => {
    if (!isOnline) return null;
    const result = await CatalogSyncService.syncPosCatalog(branchId || undefined, forceFull);
    await queryClient.invalidateQueries({ queryKey: ['pos'] });
    return result;
  }, [branchId, isOnline, queryClient]);

  return {
    gridProducts: gridProducts as PosVariant[] | undefined,
    searchResults: searchResults as PosVariant[] | undefined,
    gridLoading,
    searchLoading,
    lookupBarcode,
    refreshCatalog,
  };
}
