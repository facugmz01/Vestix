export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    barcode: string | null;
    basePrice: number;
    attributes: Record<string, string>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
