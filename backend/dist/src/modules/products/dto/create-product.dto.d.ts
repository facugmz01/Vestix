export declare class ProductImageDto {
    url: string;
    altText?: string;
    displayOrder?: number;
}
export declare class CreateProductDto {
    name: string;
    baseSku: string;
    description?: string;
    categoryId: string;
    brandId: string;
    metadata?: Record<string, any>;
    images?: ProductImageDto[];
}
