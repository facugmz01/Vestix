import { useCallback, useEffect, useState } from 'react';
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

export function usePosOffline(branchId: string, selectedCustomerId: string, search: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const { data: gridProducts, isLoading: gridLoading } = useQuery({
    queryKey: ['pos', 'gridProducts', selectedCustomerId, isOnline],
    queryFn: async () => {
      if (isOnline) {
        try {
          const online = await posApi.searchProduct('', selectedCustomerId || undefined);
          if (online?.length) return online;
        } catch {
          // fall through to local catalog cache
        }
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

  const invalidateCatalogQueries = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['pos'] });
  }, [queryClient]);

  const refreshCatalog = useCallback(async (forceFull = false) => {
    if (!navigator.onLine) return null;
    const result = await CatalogSyncService.syncPosCatalog(branchId || undefined, forceFull);
    await invalidateCatalogQueries();
    return result;
  }, [branchId, invalidateCatalogQueries]);

  return {
    isOnline,
    gridProducts: gridProducts as PosVariant[] | undefined,
    searchResults: searchResults as PosVariant[] | undefined,
    gridLoading,
    searchLoading,
    lookupBarcode,
    refreshCatalog,
    invalidateCatalogQueries,
  };
}
