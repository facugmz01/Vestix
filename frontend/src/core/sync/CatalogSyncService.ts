import { db, PosCatalogItem } from '../db/db';
import { apiClient } from '../api/apiClient';

export class CatalogSyncService {
  /**
   * Fetches the flattened catalog from the backend and performs a bulk replace in Dexie.
   * This is meant to be called when the POS initializes or when a manual sync is triggered.
   */
  static async syncPosCatalog(): Promise<void> {
    try {
      // 1. Fetch from backend
      const response = await apiClient.get<PosCatalogItem[]>('/catalog/pos-sync');
      const catalogData = response.data;

      // 2. Perform a transactional bulk replace
      await db.transaction('rw', db.catalog, async () => {
        // Clear old catalog (if we want full replace instead of differential update for V1)
        await db.catalog.clear();
        
        // Insert new data
        await db.catalog.bulkAdd(catalogData);
      });

      console.log(`[Sync] POS Catalog synchronized. Downloaded ${catalogData.length} items.`);
    } catch (error) {
      console.error('[Sync] Failed to sync POS catalog:', error);
      throw error;
    }
  }

  /**
   * Searches the local Dexie DB by SKU or Barcode.
   * Very fast, completely offline.
   */
  static async findByBarcodeOrSku(query: string): Promise<PosCatalogItem | undefined> {
    return db.catalog
      .where('sku').equals(query)
      .or('primaryBarcode').equals(query)
      .or('allBarcodes').equals(query)
      .first();
  }
}
