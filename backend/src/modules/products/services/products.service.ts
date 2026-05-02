import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CategoriesService, BrandsService } from './taxonomy.service';
import * as crypto from 'crypto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService
  ) {}

  async create(createProductDto: CreateProductDto) {
    // 1. Strict Referential Integrity Checks
    await this.categoriesService.findOne(createProductDto.categoryId);
    if (createProductDto.brandId) {
      await this.brandsService.findOne(createProductDto.brandId);
    }

    // 2. Base SKU Uniqueness & Generation
    const finalSku = createProductDto.baseSku || `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const exists = await this.prisma.product.findUnique({ where: { baseSku: finalSku } });
    if (exists) throw new ConflictException(`El SKU Base ${finalSku} ya está en uso`);

    // 3. Create Product and Variants in a Transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: createProductDto.name,
          baseSku: finalSku,
          description: createProductDto.description,
          categoryId: createProductDto.categoryId,
          brandId: createProductDto.brandId,
          isVariable: createProductDto.isVariable || false,
          costPrice: createProductDto.costPrice || 0,
          isActive: true,
          isPublished: false,
          images: (createProductDto.images as any) || [],
          metadata: createProductDto.metadata || {},
        },
        include: { category: true, brand: true }
      });

      // 4. Create Variants
      if (createProductDto.isVariable && createProductDto.variants?.length) {
        await tx.productVariant.createMany({
          data: createProductDto.variants.map(v => ({
            ...v,
            productId: product.id,
            costPrice: v.costPrice || createProductDto.costPrice || 0,
            sku: v.sku || `${finalSku}-${v.size || ''}-${v.color || ''}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase()
          }))
        });
      } else {
        // Simple product: create one default variant
        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: finalSku,
            basePrice: createProductDto.variants?.[0]?.basePrice || 0,
            costPrice: createProductDto.costPrice || 0,
            isActive: true
          }
        });
      }

      return product;
    });
  }

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 15;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { baseSku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, brand: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true, variants: true }
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    // Re-validate foreign relations if they are being updated
    if (updateProductDto.categoryId) await this.categoriesService.findOne(updateProductDto.categoryId);
    if (updateProductDto.brandId) await this.brandsService.findOne(updateProductDto.brandId);

    // Re-validate SKU uniqueness if it's changing
    if (updateProductDto.baseSku && updateProductDto.baseSku !== product.baseSku) {
      const exists = await this.prisma.product.findUnique({ where: { baseSku: updateProductDto.baseSku } });
      if (exists) throw new ConflictException('El SKU Base ya está en uso por otro producto');
    }

    const { variants, images, ...data } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        images: images as any,
      },
      include: { category: true, brand: true }
    });
  }

  async findVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createVariant(productId: string, data: any) {
    return this.prisma.productVariant.create({
      data: {
        ...data,
        productId,
        sku: data.sku || `SKU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
      }
    });
  }

  async updateVariant(id: string, data: any) {
    return this.prisma.productVariant.update({
      where: { id },
      data
    });
  }

  async deleteVariant(id: string) {
    return this.prisma.productVariant.delete({
      where: { id }
    });
  }

  async generateCombinations(productId: string, dto: any) {
    const variants = [];
    for (const color of dto.colors) {
      for (const size of dto.sizes) {
        variants.push({
          productId,
          color,
          size,
          basePrice: dto.basePrice,
          sku: `${productId.substring(0, 4)}-${color}-${size}`.toUpperCase(),
          isActive: true
        });
      }
    }

    // Usar createMany para eficiencia
    return this.prisma.productVariant.createMany({
      data: variants,
      skipDuplicates: true
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    
    // Eliminación en cascada segura: borramos variantes primero.
    // Si alguna variante tiene movimientos de stock u órdenes, Prisma lanzará P2003
    // y la transacción se abortará protegiendo la integridad de los datos.
    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({
        where: { productId: product.id }
      });
      
      return tx.product.delete({
        where: { id: product.id }
      });
    });
  }
}
