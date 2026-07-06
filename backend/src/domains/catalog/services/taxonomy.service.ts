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

  async update(id: string, data: { name?: string }) {
    await this.findOne(id);
    return this.prisma.brand.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findOne(id);
    const productCount = await this.prisma.product.count({ where: { brandId: id } });
    if (productCount > 0) {
      throw new ConflictException(`No se puede eliminar la marca: ${productCount} producto(s) la utilizan.`);
    }
    return this.prisma.brand.delete({ where: { id } });
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

  async update(id: string, data: { name?: string; parentId?: string }) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findOne(id);
    const children = await this.prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      throw new ConflictException('No se puede eliminar una categoría que tiene subcategorías.');
    }
    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ConflictException(`No se puede eliminar la categoría: ${productCount} producto(s) la utilizan.`);
    }
    return this.prisma.category.delete({ where: { id } });
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

  async update(id: string, data: { name?: string; values?: string[] }) {
    // Replace all values: delete existing and recreate
    await this.prisma.attributeValue.deleteMany({ where: { attributeId: id } });
    return this.prisma.attribute.update({
      where: { id },
      data: {
        name: data.name,
        values: data.values ? { create: data.values.map(v => ({ value: v })) } : undefined
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

  async findAllPaged(query: { page?: number | string; pageSize?: number | string; search?: string; type?: string; isActive?: boolean | string }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } }
      ];
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === true || String(query.isActive) === 'true';
    }

    const [data, total] = await Promise.all([
      this.prisma.priceList.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.priceList.count({ where })
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const list = await this.prisma.priceList.findUnique({
      where: { id }
    });
    if (!list) throw new NotFoundException(`Lista de precios ${id} no encontrada`);
    return list;
  }

  async create(data: any) {
    const { name, code, currency, type, modifierPercentage, isActive, margin } = data;
    
    const computedMargin = margin !== undefined ? Number(margin) : 1.0;
    
    let computedModifierPercentage = modifierPercentage !== undefined ? Number(modifierPercentage) : 0;
    if (margin !== undefined && modifierPercentage === undefined) {
      computedModifierPercentage = Math.round((computedMargin - 1) * 100);
    }

    let computedType = type || 'BASE';
    if (margin !== undefined && type === undefined) {
      computedType = 'MODIFIER';
    }

    const isPercentageBased = computedType === 'MODIFIER';
    const percentageDiscount = isPercentageBased ? -computedModifierPercentage : null;

    return this.prisma.priceList.create({
      data: {
        name,
        code: code || name || '',
        currency: currency || 'ARS',
        type: computedType,
        modifierPercentage: computedModifierPercentage,
        isActive: isActive ?? true,
        isPercentageBased,
        percentageDiscount,
        margin: computedMargin,
      }
    });
  }

  async update(id: string, data: any) {
    const updateData: any = { ...data };
    
    if (updateData.margin !== undefined && updateData.modifierPercentage === undefined) {
      updateData.modifierPercentage = Math.round((Number(updateData.margin) - 1) * 100);
      if (updateData.type === undefined) {
        updateData.type = 'MODIFIER';
      }
    }

    if (updateData.type !== undefined) {
      updateData.isPercentageBased = updateData.type === 'MODIFIER';
    }
    if (updateData.modifierPercentage !== undefined) {
      updateData.percentageDiscount = updateData.isPercentageBased || updateData.type === 'MODIFIER'
        ? -Number(updateData.modifierPercentage)
        : null;
      updateData.modifierPercentage = Number(updateData.modifierPercentage);
    }
    if (updateData.margin !== undefined) {
      updateData.margin = Number(updateData.margin);
    }
    
    return this.prisma.priceList.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.priceList.delete({ where: { id } });
  }

  async findItems(priceListId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [variants, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        skip,
        take: pageSize,
        include: {
          product: {
            select: { name: true }
          },
          priceListEntries: {
            where: { priceListId }
          }
        },
        orderBy: { sku: 'asc' }
      }),
      this.prisma.productVariant.count()
    ]);

    const data = variants.map(v => {
      const entry = v.priceListEntries[0];
      const overridePrice = entry ? entry.overridePrice : v.basePrice;
      
      let variantName = v.product.name;
      const attributes = [];
      if (v.color) attributes.push(v.color);
      if (v.size) attributes.push(v.size);
      if (attributes.length > 0) {
         variantName += ` (${attributes.join(' / ')})`;
      }

      return {
        id: entry?.id || v.id,
        priceListId,
        variantId: v.id,
        overridePrice,
        variantSku: v.sku,
        variantName,
        basePrice: v.basePrice
      };
    });

    return { data, total, page, pageSize };
  }

  async assignToCustomers(priceListId: string, customerIds: string[]) {
    await this.prisma.customer.updateMany({
      where: {
        id: { in: customerIds }
      },
      data: {
        priceListId
      }
    });
    return { success: true };
  }
}
