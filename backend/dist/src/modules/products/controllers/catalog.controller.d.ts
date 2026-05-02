import { ProductsService } from '../services/products.service';
import { CategoriesService, BrandsService } from '../services/taxonomy.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        createdAt: Date;
        name: string;
        description?: string;
        parentId?: string;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    findAll(): Promise<any[]>;
}
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    create(createBrandDto: CreateBrandDto): Promise<{
        createdAt: Date;
        name: string;
        logoUrl?: string;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    findAll(): Promise<any[]>;
}
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<{
        isActive: boolean;
        images: import("../dto/create-product.dto").ProductImageDto[];
        metadata: Record<string, any>;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        baseSku: string;
        description?: string;
        categoryId: string;
        brandId: string;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<any>;
}
