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
  categoryId?: string;
  brandId?: string;
};

export interface PosCatalogFilters {
  categoryId?: string;
  brandId?: string;
  priceListId?: string;
  stock?: 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK';
}

function applyLocalFilters(items: PosVariant[], filters: PosCatalogFilters) {
  return items.filter(item => {
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (filters.brandId && item.brandId !== filters.brandId) return false;
    // An absent stock value means the source did not provide stock data; do
    // not silently classify it as out of stock.
    if (filters.stock === 'IN_STOCK' && (typeof item.stock !== 'number' || item.stock <= 0)) return false;
    if (filters.stock === 'OUT_OF_STOCK' && (typeof item.stock !== 'number' || item.stock > 0)) return false;
    return true;
  });
}

function toVariants(items: Awaited<ReturnType<typeof CatalogSyncService.searchOffline>>): PosVariant[] {
  return items.map(item => CatalogSyncService.toProductVariant(item) as PosVariant);
}

export function usePosOffline(branchId: string, selectedCustomerId: string, search: string, filters: PosCatalogFilters = {}) {
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
    queryKey: ['pos', 'gridProducts', branchId, selectedCustomerId, isOnline, filters],
    queryFn: async () => {
      if (isOnline) {
        try {
          const online = await posApi.searchProduct('', {
            customerId: selectedCustomerId || undefined,
            branchId: branchId || undefined,
            priceListId: filters.priceListId,
          });
          if (online?.length) return applyLocalFilters(online as PosVariant[], filters);
        } catch {
          // fall through to local catalog cache
        }
      }
      const offline = await CatalogSyncService.getAllForGrid();
      return applyLocalFilters(toVariants(offline), filters);
    },
    staleTime: isOnline ? 30_000 : 60_000,
    placeholderData: previous => previous,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['pos', 'search', search, branchId, selectedCustomerId, isOnline, filters],
    queryFn: async () => {
      if (isOnline) {
        const online = await posApi.searchProduct(search, {
          customerId: selectedCustomerId || undefined,
          branchId: branchId || undefined,
          priceListId: filters.priceListId,
          limit: 100,
        });
        return applyLocalFilters(online as PosVariant[], filters);
      }
      const offline = await CatalogSyncService.searchOffline(search, 100);
      return applyLocalFilters(toVariants(offline), filters);
    },
    enabled: search.length >= 2 || (!isOnline && search.length >= 1),
    staleTime: 5_000,
    placeholderData: previous => previous,
  });

  const lookupBarcode = useCallback(async (code: string): Promise<PosVariant[]> => {
    if (isOnline) {
      try {
        return await posApi.searchProduct(code, {
          customerId: selectedCustomerId || undefined,
          branchId: branchId || undefined,
        });
      } catch {
        // fall through to offline
      }
    }
    const item = await CatalogSyncService.findByBarcodeOrSku(code);
    if (item) return [CatalogSyncService.toProductVariant(item) as PosVariant];
    const partial = await CatalogSyncService.searchOffline(code, 50);
    return toVariants(partial);
  }, [isOnline, selectedCustomerId, branchId]);

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
