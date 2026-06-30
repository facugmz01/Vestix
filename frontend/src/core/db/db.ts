import Dexie, { Table } from 'dexie';

// Interfaces for our database models
export interface PosCatalogItem {
  id: string; // variantId
  productId: string;
  name: string;
  categoryId: string;
  sku: string;
  primaryBarcode: string | null;
  allBarcodes: string[];
  price: number;
  size: string | null;
  color: string | null;
}

export interface SyncQueueItem {
  id?: number; // Auto-incremented local ID
  type: 'SALE' | 'SALE_RETURN' | 'CREATE_CUSTOMER' | 'UPDATE_CUSTOMER';
  payload: any; // The JSON payload to send to the backend
  createdAt: string; // ISO date
  status: 'PENDING' | 'ERROR';
  retryCount: number;
  lastError?: string;
}

export class PosDatabase extends Dexie {
  catalog!: Table<PosCatalogItem, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('PosOfflineDB');
    
    // Define the schema. 
    // '&id' means id is primary key and unique.
    // '*allBarcodes' means it indexes every element in the array for fast lookups.
    this.version(1).stores({
      catalog: '&id, productId, categoryId, sku, primaryBarcode, *allBarcodes, name',
      syncQueue: '++id, type, status, createdAt',
    });
  }
}

// Export a singleton instance
export const db = new PosDatabase();
