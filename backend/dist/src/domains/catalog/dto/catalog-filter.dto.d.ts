export declare class CatalogFilterDto {
    searchQuery?: string;
    sortBy?: string;
    categoryId?: string;
    brandId?: string;
    brand?: string;
    inStockOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    attributes?: {
        key: string;
        value: string;
    }[];
    page?: number;
    pageSize?: number;
}
