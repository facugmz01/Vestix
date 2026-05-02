import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CategoriesService, BrandsService } from './taxonomy.service';
export declare class ProductsService {
    private readonly prisma;
    private readonly categoriesService;
    private readonly brandsService;
    constructor(prisma: PrismaService, categoriesService: CategoriesService, brandsService: BrandsService);
    create(createProductDto: CreateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            parentId: string | null;
            createdAt: Date;
        };
        brand: {
            id: string;
            name: string;
            createdAt: Date;
        };
    } & {
        id: string;
        name: string;
        baseSku: string | null;
        description: string | null;
        categoryId: string;
        brandId: string | null;
        isVariable: boolean;
        costPrice: number;
        isActive: boolean;
        isPublished: boolean;
        images: import(".prisma/client").Prisma.JsonValue;
        metadata: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query?: any): Promise<{
        data: ({
            category: {
                id: string;
                name: string;
                parentId: string | null;
                createdAt: Date;
            };
            brand: {
                id: string;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            name: string;
            baseSku: string | null;
            description: string | null;
            categoryId: string;
            brandId: string | null;
            isVariable: boolean;
            costPrice: number;
            isActive: boolean;
            isPublished: boolean;
            images: import(".prisma/client").Prisma.JsonValue;
            metadata: import(".prisma/client").Prisma.JsonValue;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        category: {
            id: string;
            name: string;
            parentId: string | null;
            createdAt: Date;
        };
        brand: {
            id: string;
            name: string;
            createdAt: Date;
        };
        variants: {
            id: string;
            productId: string;
            sku: string;
            barcode: string | null;
            size: string | null;
            color: string | null;
            imageUrl: string | null;
            costPrice: number;
            basePrice: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        baseSku: string | null;
        description: string | null;
        categoryId: string;
        brandId: string | null;
        isVariable: boolean;
        costPrice: number;
        isActive: boolean;
        isPublished: boolean;
        images: import(".prisma/client").Prisma.JsonValue;
        metadata: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            parentId: string | null;
            createdAt: Date;
        };
        brand: {
            id: string;
            name: string;
            createdAt: Date;
        };
    } & {
        id: string;
        name: string;
        baseSku: string | null;
        description: string | null;
        categoryId: string;
        brandId: string | null;
        isVariable: boolean;
        costPrice: number;
        isActive: boolean;
        isPublished: boolean;
        images: import(".prisma/client").Prisma.JsonValue;
        metadata: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findVariants(productId: string): Promise<{
        id: string;
        productId: string;
        sku: string;
        barcode: string | null;
        size: string | null;
        color: string | null;
        imageUrl: string | null;
        costPrice: number;
        basePrice: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createVariant(productId: string, data: any): Promise<{
        id: string;
        productId: string;
        sku: string;
        barcode: string | null;
        size: string | null;
        color: string | null;
        imageUrl: string | null;
        costPrice: number;
        basePrice: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateVariant(id: string, data: any): Promise<{
        id: string;
        productId: string;
        sku: string;
        barcode: string | null;
        size: string | null;
        color: string | null;
        imageUrl: string | null;
        costPrice: number;
        basePrice: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteVariant(id: string): Promise<{
        id: string;
        productId: string;
        sku: string;
        barcode: string | null;
        size: string | null;
        color: string | null;
        imageUrl: string | null;
        costPrice: number;
        basePrice: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateCombinations(productId: string, dto: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        baseSku: string | null;
        description: string | null;
        categoryId: string;
        brandId: string | null;
        isVariable: boolean;
        costPrice: number;
        isActive: boolean;
        isPublished: boolean;
        images: import(".prisma/client").Prisma.JsonValue;
        metadata: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
