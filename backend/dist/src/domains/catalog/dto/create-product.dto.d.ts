export declare enum ProductType {
    SINGLE = "SINGLE",
    VARIABLE = "VARIABLE",
    COMBO = "COMBO"
}
export declare class ProductComboLineDto {
    childVariantId: string;
    quantity: number;
}
export declare class ProductVariantDto {
    id?: string;
    sku?: string;
    size?: string;
    color?: string;
    imageUrl?: string;
    costPrice?: number;
    basePrice?: number;
    isActive?: boolean;
    attributes?: Record<string, any>;
}
export declare class CreateProductDto {
    name: string;
    description?: string;
    categoryId: string;
    brandId?: string;
    baseSku?: string;
    type?: ProductType;
    isVariable?: boolean;
    manageBatches?: boolean;
    costPrice?: number;
    basePrice?: number;
    comboLines?: ProductComboLineDto[];
    variants?: ProductVariantDto[];
    isActive?: boolean;
    isPublished?: boolean;
    metadata?: Record<string, any>;
    images?: string[];
}
