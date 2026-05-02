export declare class ProductVariantDto {
    id?: string;
    sku?: string;
    size?: string;
    color?: string;
    imageUrl?: string;
    costPrice?: number;
    basePrice?: number;
    isActive?: boolean;
}
export declare class CreateProductDto {
    name: string;
    description?: string;
    categoryId: string;
    brandId?: string;
    baseSku?: string;
    isVariable?: boolean;
    costPrice?: number;
    basePrice?: number;
    variants?: ProductVariantDto[];
    isActive?: boolean;
    isPublished?: boolean;
    metadata?: Record<string, any>;
    images?: string[];
}
