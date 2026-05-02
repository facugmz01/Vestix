export interface ProductVariant {
  id: string;
  productId: string;
  
  // The exact identifier (e.g., TSHIRT-RED-L)
  sku: string; 
  
  // The physical barcode (EAN/UPC) scannable at POS
  barcode: string | null; 
  
  // V1 Pricing Model: Base Price stored at the variant level
  basePrice: number; 
  
  // JSONB column storing variant traits like { "size": "L", "color": "Red" }
  attributes: Record<string, string>; 
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
