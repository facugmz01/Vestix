export enum PriceListType {
  RETAIL = 'RETAIL',           // Default public pricing
  WHOLESALE = 'WHOLESALE',     // B2B volume pricing
  VIP = 'VIP',                 // Loyalty pricing
  PROMOTIONAL = 'PROMOTIONAL', // Temporary sales (e.g., Black Friday)
}

export interface PriceList {
  id: string;
  name: string;
  type: PriceListType;
  isActive: boolean;
  currency: string;
  
  // Architectural decision: Support both explicit entry overrides AND flat percentage modifiers
  // If true, the system skips explicit entries and just calculates (Base Price - X%)
  isPercentageBased: boolean; 
  percentageDiscount?: number; 
  
  // Vital for promotional lists that expire
  validFrom?: Date;
  validTo?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceListEntry {
  id: string;
  priceListId: string;
  variantId: string;
  
  // The explicit rigid price assigned to this specific variant under this price list
  overridePrice: number; 
  
  updatedAt: Date;
}
