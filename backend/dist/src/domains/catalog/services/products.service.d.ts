import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CategoriesService, BrandsService } from './taxonomy.service';
import { BulkValidateDto, BulkImportDto } from '../dto/bulk-product.dto';
import { BulkUpdatePricesDto } from '../dto/bulk-update-prices.dto';
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
            updatedAt: Date;
        };
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        baseSku: string | null;
        description: string | null;
        categoryId: string;
        brandId: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        isVariable: boolean;
        manageBatches: boolean;
        costPrice: number;
        isActive: boolean;
        isPublished: boolean;
        preferredSupplierId: string | null;
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
                updatedAt: Date;
            };
            brand: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            baseSku: string | null;
            description: string | null;
            categoryId: string;
            brandId: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            isVariable: boolean;
            manageBatches: boolean;
            costPrice: number;
            isActive: boolean;
            isPublished: boolean;
            preferredSupplierId: string | null;
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
            updatedAt: Date;
        };
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
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
            attributes: import(".prisma/client").Prisma.JsonValue;
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
        type: import(".prisma/client").$Enums.ProductType;
        isVariable: boolean;
        manageBatches: boolean;
        costPrice: number;
        isActive: boolean;
        isPublished: boolean;
        preferredSupplierId: string | null;
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
            updatedAt: Date;
        };
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
        comboLines: {
            id: string;
            parentProductId: string;
            childVariantId: string;
            quantity: number;
        }[];
    } & {
        id: string;
        name: string;
        baseSku: string | null;
        description: string | null;
        categoryId: string;
        brandId: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        isVariable: boolean;
        manageBatches: boolean;
        costPrice: number;
        isActive: boolean;
        isPublished: boolean;
        preferredSupplierId: string | null;
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
        attributes: import(".prisma/client").Prisma.JsonValue;
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
        attributes: import(".prisma/client").Prisma.JsonValue;
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
        attributes: import(".prisma/client").Prisma.JsonValue;
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
        attributes: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateCombinations(productId: string, dto: any): Promise<any[] | import(".prisma/client").Prisma.BatchPayload>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    bulkValidate(dto: BulkValidateDto): Promise<{
        validRows: any[];
        conflicts: any[];
    }>;
    bulkImport(dto: BulkImportDto): Promise<{
        success: boolean;
        createdCount: number;
        updatedCount: number;
    }>;
    findAllVariants(search?: string): Promise<({
        product: {
            id: string;
            name: string;
            baseSku: string | null;
            description: string | null;
            categoryId: string;
            brandId: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            isVariable: boolean;
            manageBatches: boolean;
            costPrice: number;
            isActive: boolean;
            isPublished: boolean;
            preferredSupplierId: string | null;
            images: import(".prisma/client").Prisma.JsonValue;
            metadata: import(".prisma/client").Prisma.JsonValue;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
        attributes: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    bulkUpdatePrices(dto: BulkUpdatePricesDto): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    getPublicProducts(query?: any): Promise<{
        data: {
            id: string;
            name: string;
            description: string;
            images: import(".prisma/client").Prisma.JsonValue;
            category: string;
            brand: string;
            lowestPrice: number;
            inStock: boolean;
            totalStock: number;
            variants: {
                id: string;
                sku: string;
                price: number;
                stock: number;
                attributes: import(".prisma/client").Prisma.JsonValue;
            }[];
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getPublicProduct(id: string): Promise<{
        id: string;
        name: string;
        description: string;
        images: import(".prisma/client").Prisma.JsonValue;
        category: string;
        brand: string;
        lowestPrice: number;
        inStock: boolean;
        totalStock: number;
        variants: {
            id: string;
            sku: string;
            price: number;
            stock: number;
            attributes: import(".prisma/client").Prisma.JsonValue;
        }[];
    }>;
}
