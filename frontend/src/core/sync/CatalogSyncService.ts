import { db, PosCatalogItem } from '../db/db';
import { get } from '@/api/client';

interface CatalogSyncResponse {
  status: string;
  timestamp: string;
  data: {
    id: string;
    sku: string;
    barcode: string | null;
    name: string;
    basePrice: number;
    categoryId: string;
    categoryName?: string;
    brandName?: string;
  }[];
}

export class CatalogSyncService {
  static async syncPosCatalog(): Promise<void> {
    try {
      const response = await get<CatalogSyncResponse>('/pos/sync/catalog');
      const catalogData = response.data || [];

      const items: PosCatalogItem[] = catalogData.map(item => ({
        id: item.id,
        productId: item.categoryId,
        sku: item.sku,
        primaryBarcode: item.barcode || item.sku,
        allBarcodes: item.barcode ? [item.barcode] : [item.sku],
        name: item.name,
        price: item.basePrice,
        categoryId: item.categoryId,
        size: null,
        color: null,
      }));

      await db.transaction('rw', db.catalog, async () => {
        await db.catalog.clear();
        if (items.length > 0) {
          await db.catalog.bulkAdd(items);
        }
      });

      console.log(`[Sync] POS Catalog synchronized. Downloaded ${items.length} items.`);
    } catch (error) {
      console.error('[Sync] Failed to sync POS catalog:', error);
      throw error;
    }
  }

  static async findByBarcodeOrSku(query: string): Promise<PosCatalogItem | undefined> {
    return db.catalog
      .where('sku').equals(query)
      .or('primaryBarcode').equals(query)
      .or('allBarcodes').equals(query)
      .first();
  }
}
