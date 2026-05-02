export interface BranchConfig {
  id: string;
  branchId: string;
  
  // Localization
  timezone: string;
  
  // POS Specifics
  isPosEnabled: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  
  // Localization / Financial specifics (e.g., Argentina AFIP)
  taxIdentifier?: string; // e.g. CUIT
  afipPointOfSale?: number; // Punto de Venta specific to this physical location
  
  updatedAt: Date;
}
