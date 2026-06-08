/**
 * MATERIALIZED VIEW OF INVENTORY
 * This table is incrementally updated by the Inventory Movements to provide lightning-fast
 * reads for the POS and E-commerce catalog, preventing the need to SUM 1,000,000 movement records.
 */
export interface StockLevel {
  variantId: string;
  warehouseId: string;
  
  // Denormalized from Warehouse table to allow fast "Total stock in this Branch" queries
  branchId: string | null;   
  
  // The actual number of physical items sitting on the shelf
  physicalQuantity: number;  
  
  // Items that have been purchased online but haven't shipped yet
  reservedQuantity: number;  
  
  // The critical number: (Physical - Reserved). This is what the POS and Website consider "sellable"
  availableQuantity: number; 
  
  updatedAt: Date;
}
