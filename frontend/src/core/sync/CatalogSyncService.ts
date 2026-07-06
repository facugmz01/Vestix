import { db, PosCatalogItem } from '../db/db';
import { apiClient } from '../api/apiClient';

export class CatalogSyncService {
  static async syncPosCatalog(): Promise<void> {
    try {
      const response = await apiClient.get<{ data: PosCatalogItem[] }>('/pos/sync/catalog');
      const catalogData = response.data?.data ?? response.data;

      await db.transaction('rw', db.catalog, async () => {
        await db.catalog.clear();
        await db.catalog.bulkAdd(catalogData as PosCatalogItem[]);
      });

      console.log(`[Sync] POS Catalog synchronized. Downloaded ${(catalogData as PosCatalogItem[]).length} items.`);
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
