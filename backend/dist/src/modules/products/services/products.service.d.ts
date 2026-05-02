import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CategoriesService, BrandsService } from './taxonomy.service';
export declare class ProductsService {
    private readonly categoriesService;
    private readonly brandsService;
    constructor(categoriesService: CategoriesService, brandsService: BrandsService);
    private products;
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
