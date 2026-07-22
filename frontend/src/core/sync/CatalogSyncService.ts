import { db, SYNC_META_KEYS, type PosCatalogItem } from '../db/db';
import { get } from '@/api/client';
import type { ProductVariant } from '@/types';

interface CatalogSyncItem {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  barcodes?: string[];
  name: string;
  basePrice: number;
  categoryId: string;
  categoryName?: string;
  brandName?: string;
  size?: string | null;
  color?: string | null;
  imageUrl?: string | null;
  stock?: number;
  updatedAt?: string;
}

interface CatalogSyncResponse {
  status: string;
  timestamp: string;
  incremental?: boolean;
  removedIds?: string[];
  data: CatalogSyncItem[];
}

export interface CatalogSyncResult {
  itemCount: number;
  incremental: boolean;
  removed: number;
  timestamp: string;
}

export class CatalogSyncService {
  private static mapItem(item: CatalogSyncItem): PosCatalogItem {
    const allBarcodes = [
      ...(item.barcode ? [item.barcode] : []),
      ...(item.barcodes || []),
      item.sku,
    ].filter((v, i, arr) => v && arr.indexOf(v) === i) as string[];

    return {
      id: item.id,
      productId: item.productId,
      sku: item.sku,
      primaryBarcode: item.barcode || item.sku,
      allBarcodes,
      name: item.name,
      price: item.basePrice,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      brandName: item.brandName,
      size: item.size ?? null,
      color: item.color ?? null,
      imageUrl: item.imageUrl ?? null,
      stock: item.stock ?? 0,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
  }

  static async getLastSyncAt(): Promise<string | null> {
    const row = await db.syncMeta.get(SYNC_META_KEYS.LAST_CATALOG_SYNC);
    return row?.value ?? null;
  }

  static async getCatalogCount(): Promise<number> {
    return db.catalog.count();
  }

  static toProductVariant(item: PosCatalogItem): ProductVariant & {
    name: string;
    category?: string;
    categoryId?: string;
    brand?: string;
    stock?: number;
    imageUrl?: string | null;
  } {
    return {
      id: item.id,
      productId: item.productId,
      sku: item.sku,
      barcode: item.primaryBarcode || item.sku,
      basePrice: item.price,
      costPrice: 0,
      size: item.size || undefined,
      color: item.color || undefined,
      name: item.name,
      category: item.categoryName,
      categoryId: item.categoryId,
      brand: item.brandName,
      stock: item.stock,
      imageUrl: item.imageUrl,
      product: item.categoryId ? { categoryId: item.categoryId } : undefined,
    } as ProductVariant & {
      name: string;
      category?: string;
      categoryId?: string;
      brand?: string;
      stock?: number;
      imageUrl?: string | null;
      product?: { categoryId?: string };
    };
  }

  static async syncPosCatalog(branchId?: string, forceFull = false): Promise<CatalogSyncResult> {
    const since = forceFull ? undefined : (await this.getLastSyncAt()) ?? undefined;
    const params: Record<string, string> = {};
    if (since) params.since = since;
    if (branchId) params.branchId = branchId;

    const response = await get<CatalogSyncResponse>('/pos/sync/catalog', { params });
    const items = (response.data || []).map(item => this.mapItem(item));
    const removedIds = response.removedIds || [];

    await db.transaction('rw', db.catalog, db.syncMeta, async () => {
      if (!response.incremental) {
        await db.catalog.clear();
      }

      for (const id of removedIds) {
        await db.catalog.delete(id);
      }

      for (const item of items) {
        await db.catalog.put(item);
      }

      await db.syncMeta.put({
        key: SYNC_META_KEYS.LAST_CATALOG_SYNC,
        value: response.timestamp,
      });
      const count = await db.catalog.count();
      await db.syncMeta.put({
        key: SYNC_META_KEYS.LAST_CATALOG_COUNT,
        value: String(count),
      });
    });

    return {
      itemCount: await db.catalog.count(),
      incremental: !!response.incremental,
      removed: removedIds.length,
      timestamp: response.timestamp,
    };
  }

  static async findByBarcodeOrSku(query: string): Promise<PosCatalogItem | undefined> {
    const normalized = query.trim();
    if (!normalized) return undefined;

    const bySku = await db.catalog.where('sku').equals(normalized).first();
    if (bySku) return bySku;

    const byBarcode = await db.catalog.where('primaryBarcode').equals(normalized).first();
    if (byBarcode) return byBarcode;

    const all = await db.catalog.toArray();
    return all.find(item => item.allBarcodes.includes(normalized));
  }

  static async searchOffline(query: string, limit = 20): Promise<PosCatalogItem[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 1) {
      return db.catalog.orderBy('name').limit(200).toArray();
    }

    const all = await db.catalog.toArray();
    return all
      .filter(item => {
        if (item.sku.toLowerCase().includes(q)) return true;
        if (item.primaryBarcode?.toLowerCase().includes(q)) return true;
        if (item.allBarcodes.some(b => b.toLowerCase().includes(q))) return true;
        if (item.name.toLowerCase().includes(q)) return true;
        return false;
      })
      .slice(0, limit);
  }

  static async getAllForGrid(): Promise<PosCatalogItem[]> {
    return db.catalog.orderBy('name').toArray();
  }
}
