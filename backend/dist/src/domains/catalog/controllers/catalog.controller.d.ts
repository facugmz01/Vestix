import { ProductsService } from '../services/products.service';
import { CategoriesService, BrandsService, AttributesService, PriceListService } from '../services/taxonomy.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { BulkValidateDto, BulkImportDto } from '../dto/bulk-product.dto';
import { BulkUpdatePricesDto } from '../dto/bulk-update-prices.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        parent: {
            id: string;
            name: string;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    update(id: string, dto: any): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    create(createBrandDto: CreateBrandDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    update(id: string, dto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
        images: import(".prisma/client").Prisma.JsonValue;
        metadata: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
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
    bulkUpdatePrices(dto: BulkUpdatePricesDto): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    findAll(query: any): Promise<{
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
        images: import(".prisma/client").Prisma.JsonValue;
        metadata: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findVariants(id: string): Promise<{
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
    createVariant(id: string, data: any): Promise<{
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
    generateCombinations(id: string, dto: any): Promise<any[] | import(".prisma/client").Prisma.BatchPayload>;
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
        images: import(".prisma/client").Prisma.JsonValue;
        metadata: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
export declare class VariantsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(search?: string): Promise<({
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
    update(id: string, data: any): Promise<{
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
    delete(id: string): Promise<{
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
}
export declare class AttributesController {
    private readonly attributesService;
    constructor(attributesService: AttributesService);
    findAll(): Promise<({
        values: {
            id: string;
            attributeId: string;
            value: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    create(data: CreateAttributeDto): Promise<{
        values: {
            id: string;
            attributeId: string;
            value: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<{
        values: {
            id: string;
            attributeId: string;
            value: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare class PriceListController {
    private readonly priceListService;
    constructor(priceListService: PriceListService);
    findAll(): Promise<{
        id: string;
        name: string;
        type: string;
        currency: string;
        margin: number;
        isActive: boolean;
        isPercentageBased: boolean;
        percentageDiscount: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(data: CreatePriceListDto): Promise<{
        id: string;
        name: string;
        type: string;
        currency: string;
        margin: number;
        isActive: boolean;
        isPercentageBased: boolean;
        percentageDiscount: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: UpdatePriceListDto): Promise<{
        id: string;
        name: string;
        type: string;
        currency: string;
        margin: number;
        isActive: boolean;
        isPercentageBased: boolean;
        percentageDiscount: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        type: string;
        currency: string;
        margin: number;
        isActive: boolean;
        isPercentageBased: boolean;
        percentageDiscount: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
