import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
export declare class BrandsService {
    private brands;
    create(createBrandDto: CreateBrandDto): Promise<{
        createdAt: Date;
        name: string;
        logoUrl?: string;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
}
export declare class CategoriesService {
    private categories;
    create(createCategoryDto: CreateCategoryDto): Promise<{
        createdAt: Date;
        name: string;
        description?: string;
        parentId?: string;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
}
