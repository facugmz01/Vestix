import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    const exists = await this.prisma.brand.findUnique({ where: { name: createBrandDto.name } });
    if (exists) throw new ConflictException('La marca ya existe');
    
    return this.prisma.brand.create({
      data: { name: createBrandDto.name }
    });
  }

  async findAll() { 
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' }
    }); 
  }
  
  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException(`Marca ${id} no encontrada`);
    return brand;
  }
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { name: createCategoryDto.name } });
    if (exists) throw new ConflictException('La categoría ya existe');

    return this.prisma.category.create({
      data: { 
        name: createCategoryDto.name,
        parentId: createCategoryDto.parentId
      }
    });
  }

  async findAll() { 
    return this.prisma.category.findMany({
      include: { parent: true },
      orderBy: { name: 'asc' }
    }); 
  }
  
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Categoría ${id} no encontrada`);
    return category;
  }
}

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.attribute.findMany({
      include: { values: true },
      orderBy: { name: 'asc' }
    });
  }

  async create(data: any) {
    return this.prisma.attribute.create({
      data: {
        name: data.name,
        values: {
          create: data.values?.map((v: string) => ({ value: v })) || []
        }
      },
      include: { values: true }
    });
  }

  async delete(id: string) {
    return this.prisma.attribute.delete({ where: { id } });
  }
}

@Injectable()
export class PriceListService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.priceList.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: any) {
    console.log('[TaxonomyService] CREATING PriceList:', data);
    const result = await this.prisma.priceList.create({ data });
    console.log('[TaxonomyService] CREATED Success:', result.id);
    return result;
  }

  async update(id: string, data: any) {
    return this.prisma.priceList.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.priceList.delete({ where: { id } });
  }
}
