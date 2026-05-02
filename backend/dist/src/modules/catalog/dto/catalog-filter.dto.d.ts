export declare class CatalogFilterDto {
    searchQuery?: string;
    categoryId?: string;
    brandId?: string;
    inStockOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    attributes?: {
        key: string;
        value: string;
    }[];
}
