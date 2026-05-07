import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
export declare class BrandsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createBrandDto: CreateBrandDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
    }>;
    update(id: string, data: {
        name?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
    }>;
}
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
    }>;
    findAll(): Promise<({
        parent: {
            id: string;
            name: string;
            parentId: string | null;
            createdAt: Date;
        };
    } & {
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
    }>;
    update(id: string, data: {
        name?: string;
        parentId?: string;
    }): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
    }>;
}
export declare class AttributesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    })[]>;
    create(data: any): Promise<{
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
    }>;
    update(id: string, data: {
        name?: string;
        values?: string[];
    }): Promise<{
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
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
    }>;
}
export declare class PriceListService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    create(data: any): Promise<{
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
    update(id: string, data: any): Promise<{
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
