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
          data: createProductDto.variants.map(v => {
            const parts = [finalSku, v.size, v.color].filter(Boolean).join('-');
            return {
              ...v,
              productId: product.id,
              costPrice: v.costPrice || createProductDto.costPrice || 0,
              sku: v.sku || `${parts}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase()
            };
          })
        });
      } else {
        // Simple product: create one default variant
        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: finalSku,
            basePrice: createProductDto.basePrice || createProductDto.variants?.[0]?.basePrice || 0,
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

    // We also extract basePrice if present so it doesn't try to save it on the Product model
    const { variants, images, basePrice, ...data } = updateProductDto;

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...data,
          images: images as any,
        },
        include: { category: true, brand: true }
      });

      if (variants && Array.isArray(variants)) {
        const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
        
        // Identify variants to delete (exist in DB but not in payload)
        const variantsToKeepIds = variants.filter(v => v.id).map(v => v.id);
        const variantsToDelete = existingVariants.filter(v => !variantsToKeepIds.includes(v.id));

        for (const variant of variantsToDelete) {
          try {
            await tx.productVariant.delete({ where: { id: variant.id } });
          } catch (error: any) {
            // If it fails due to foreign key constraints (e.g. sales, stock), soft delete it
            if (error.code === 'P2003') {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { isActive: false }
              });
            } else {
              throw error;
            }
          }
        }

        // Update or create variants
        for (const variant of variants) {
          if (variant.id) {
            // Update
            const { id: varId, productId, createdAt, updatedAt, ...varData } = variant as any;
            await tx.productVariant.update({
              where: { id: varId },
              data: varData
            });
          } else {
            // Create
            const finalSku = updateProductDto.baseSku || product.baseSku;
            const parts = [finalSku, variant.size, variant.color].filter(Boolean).join('-');
            await tx.productVariant.create({
              data: {
                ...variant,
                productId: id,
                costPrice: variant.costPrice || updateProductDto.costPrice || product.costPrice || 0,
                sku: variant.sku || `${parts}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase()
              }
            });
          }
        }
        
        // If switched to simple, ensure at least one default variant exists
        const isNowVariable = updateProductDto.isVariable !== undefined ? updateProductDto.isVariable : product.isVariable;
        if (!isNowVariable && variants.length === 0) {
          // Check if we just deleted all variants
          const remaining = await tx.productVariant.count({ where: { productId: id, isActive: true } });
          if (remaining === 0) {
            const finalSku = updateProductDto.baseSku || product.baseSku;
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: finalSku || `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                basePrice: updateProductDto.basePrice || 0,
                costPrice: updateProductDto.costPrice || product.costPrice || 0,
                isActive: true
              }
            });
          }
        }
      }

      return updatedProduct;
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
    const { attributes, basePrice } = dto; // attributes is a Record<string, string[]>
    const attrNames = Object.keys(attributes);
    
    if (attrNames.length === 0) return [];

    let combinations: any[] = [{}];
    
    for (const name of attrNames) {
      const next: any[] = [];
      const values = attributes[name];
      
      for (const val of values) {
        for (const combo of combinations) {
          next.push({ ...combo, [name]: val });
        }
      }
      combinations = next;
    }

    const variantsData = combinations.map(combo => {
      // For backward compatibility, try to map 'color' and 'size' if they exist
      const colorKey = Object.keys(combo).find(k => k.toLowerCase() === 'color');
      const sizeKey = Object.keys(combo).find(k => 
        ['size', 'talle', 'talla', 'tamaño'].includes(k.toLowerCase()) || 
        k.toLowerCase().startsWith('talle')
      );

      const color = colorKey ? combo[colorKey] : null;
      const size = sizeKey ? combo[sizeKey] : null;

      // SKU generation logic
      const attrString = Object.values(combo).join('-');
      const sku = `${productId.substring(0, 4)}-${attrString}`.toUpperCase().replace(/\s+/g, '');

      return {
        productId,
        color,
        size,
        attributes: combo,
        basePrice: basePrice || 0,
        sku,
        isActive: true
      };
    });

    return this.prisma.productVariant.createMany({
      data: variantsData,
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

  async findAllVariants(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.productVariant.findMany({
      where,
      include: { product: true },
      take: 50,
    });
  }
}
