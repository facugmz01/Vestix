export enum WarehouseType {
  STORE_FRONT = 'STORE_FRONT',               // The actual shop floor where POS sells from (affects immediate availability)
  BACKROOM = 'BACKROOM',                     // Storage in the same physical retail branch
  DISTRIBUTION_CENTER = 'DISTRIBUTION_CENTER', // Main central warehouse (often unlinked to a specific retail branch)
  QUARANTINE = 'QUARANTINE',                 // Damaged goods, returns pending inspection (unsellable stock)
}

export interface Warehouse {
  id: string;
  branchId: string | null; // Nullable: A central Distribution Center might not be a retail branch
  name: string;
  code: string;            // e.g., 'WH-MAIN', 'NYC-BACKROOM'
  type: WarehouseType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
