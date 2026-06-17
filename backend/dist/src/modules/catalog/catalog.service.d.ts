import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AddBarcodeDto } from './dto/add-barcode.dto';
export declare class CatalogService {
    private prisma;
    constructor(prisma: PrismaService);
    createProduct(dto: CreateProductDto): Promise<{
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
    addVariantToProduct(productId: string, dto: CreateVariantDto): Promise<{
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
    addBarcodeToVariant(variantId: string, dto: AddBarcodeDto): Promise<{
        id: string;
        variantId: string;
        barcode: string;
        type: string;
        createdAt: Date;
    }>;
    findAllForPos(): Promise<{
        id: string;
        productId: string;
        name: string;
        categoryId: string;
        sku: string;
        primaryBarcode: string;
        allBarcodes: string[];
        price: number;
        size: string;
        color: string;
    }[]>;
}
