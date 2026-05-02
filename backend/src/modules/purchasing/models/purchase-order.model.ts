export enum POStatus {
  DRAFT = 'DRAFT',                           // Created but not sent to supplier
  ISSUED = 'ISSUED',                         // Sent to supplier, awaiting delivery
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED', // Some items arrived, still waiting on backorders
  COMPLETED = 'COMPLETED',                   // Fully received
  CANCELLED = 'CANCELLED',                   // Order aborted
}

export interface POLineItem {
  id: string;
  variantId: string;
  orderedQuantity: number;
  receivedQuantity: number; // Critical for tracking backorders/partials
  unitCost: number;         // Agreed upon cost with supplier
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  destinationWarehouseId: string;
  status: POStatus;
  lines: POLineItem[];
  totalCost: number;
  issuedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
