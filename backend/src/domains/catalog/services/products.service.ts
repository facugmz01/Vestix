import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CategoriesService, BrandsService } from './taxonomy.service';
import { SettingsService } from '../../../modules/settings/settings.service';
import { PriceHistoryService } from './price-history.service';
import { IdentifiersService } from '../identifiers.service';
import { MediaService } from './media.service';
import { PricingService } from '../pricing.service';
import { BulkValidateDto, BulkImportDto } from '../dto/bulk-product.dto';
import { BulkUpdatePricesDto } from '../dto/bulk-update-prices.dto';
import { isVariableProduct, normalizeProductType, syncIsVariableFlag } from '../utils/product-type.util';
import { hasRequiredShippingDimensions, normalizeMetadataWithDimensions } from '../utils/shipping-dimensions.util';
import {
  normalizeGenerateAttributes,
  cartesianCombinations,
  extractColorAndSize,
} from '../utils/generate-variants.util';
import * as crypto from 'crypto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
    private readonly settingsService: SettingsService,
    private readonly priceHistoryService: PriceHistoryService,
    private readonly identifiersService: IdentifiersService,
    private readonly mediaService: MediaService,
    private readonly pricingService: PricingService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    // 1. Strict Referential Integrity Checks
    await this.categoriesService.findOne(createProductDto.categoryId);
    if (createProductDto.brandId) {
      await this.brandsService.findOne(createProductDto.brandId);
    }

    // 2. Load settings for POS validations and SKU generation
    const posSettings = await this.settingsService.getPosSettings();
    const skuSettings = await this.settingsService.getSkuBarcodeSettings();
    const productType = normalizeProductType(createProductDto);
    const variableProduct = isVariableProduct(createProductDto);
    const autoBarcode = skuSettings.barcodeAutoGenerate !== false;

    // 2a. POS Validations & USD Logic
    if (createProductDto.metadata?.usdCurrency) {
      const type = createProductDto.metadata.usdCurrency;
      const rate = type === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;
      const costUsd = parseFloat(createProductDto.metadata.costUsd || '0');
      if (rate && costUsd > 0) {
        createProductDto.costPrice = costUsd * rate;
        if (createProductDto.variants) {
          createProductDto.variants = createProductDto.variants.map(v => ({
            ...v,
            costPrice: costUsd * rate
          }));
        }
      }
    }
    if (posSettings.requireInternalCode && !createProductDto.baseSku) {
      throw new ConflictException('El Código Interno (SKU) es obligatorio según la configuración de ventas.');
    }
    if (posSettings.requireBrand && !createProductDto.brandId) {
      throw new ConflictException('La Marca es obligatoria según la configuración de ventas.');
    }
    if (posSettings.requireDescription && !createProductDto.description?.trim()) {
      throw new ConflictException('La Descripción es obligatoria según la configuración de ventas.');
    }
    if (posSettings.requireShippingDimensions) {
      if (!hasRequiredShippingDimensions(createProductDto.metadata)) {
        throw new ConflictException('Las dimensiones de envío (peso, ancho, alto, largo) son obligatorias según la configuración de ventas.');
      }
    }

    if (productType === 'VARIABLE' && (!createProductDto.variants || createProductDto.variants.length === 0)) {
      throw new ConflictException('Los productos variables requieren al menos una variante.');
    }
    if (productType === 'COMBO' && (!createProductDto.comboLines || createProductDto.comboLines.length === 0)) {
      throw new ConflictException('Los productos combo requieren al menos un componente en la receta.');
    }

    // 2b. Base SKU Uniqueness & Generation
    let finalSku = createProductDto.baseSku?.trim();
    if (!finalSku) {
      if (skuSettings.skuAutoGenerate !== false) {
        finalSku = await this.identifiersService.generateBaseSku();
      } else {
        finalSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      }
    }
    const exists = await this.prisma.product.findUnique({ where: { baseSku: finalSku } });
    if (exists) throw new ConflictException(`El SKU Base ${finalSku} ya está en uso`);

    // Prepare barcodes before create (respect barcodeAutoGenerate setting)
    if (variableProduct && createProductDto.variants?.length) {
      for (const v of createProductDto.variants) {
        if (!v.barcode?.trim() && autoBarcode) {
          v.barcode = await this.identifiersService.generateUniqueBarcode();
        }
      }
    } else if (!createProductDto.variants?.[0]?.barcode?.trim() && autoBarcode) {
      createProductDto.variants = [
        {
          ...(createProductDto.variants?.[0] || {}),
          barcode: await this.identifiersService.generateUniqueBarcode(),
        },
      ];
    }

    if (posSettings.requireBarcode) {
      if (variableProduct) {
        const missing = (createProductDto.variants || []).some(v => !v.barcode?.trim());
        if (missing) {
          throw new ConflictException('El Código de Barras es obligatorio para el producto según la configuración de ventas.');
        }
      } else if (!createProductDto.variants?.[0]?.barcode?.trim()) {
        throw new ConflictException('El Código de Barras es obligatorio para el producto según la configuración de ventas.');
      }
    }

    const normalizedMetadata = normalizeMetadataWithDimensions(createProductDto.metadata || {});
    // Persist any base64 data-URLs to disk so the SPA can load `/uploads/...`
    // (inline base64 in JSON also blows past the body-parser limit on phone photos).
    const persistedImages = this.mediaService.persistImageRefs(createProductDto.images);

    // 3. Create Product and Variants in a Transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: createProductDto.name,
          baseSku: finalSku,
          description: createProductDto.description,
          categoryId: createProductDto.categoryId,
          brandId: createProductDto.brandId,
          type: productType,
          manageBatches: createProductDto.manageBatches || false,
          isVariable: syncIsVariableFlag(productType),
          costPrice: createProductDto.costPrice || 0,
          isActive: true,
          isPublished: false,
          images: persistedImages as any,
          metadata: normalizedMetadata,
          comboLines: productType === 'COMBO' && createProductDto.comboLines?.length ? {
            create: createProductDto.comboLines.map(cl => ({
              childVariantId: cl.childVariantId,
              quantity: Number(cl.quantity) || 1,
            }))
          } : undefined
        },
        include: {
          category: true,
          brand: true,
          comboLines: {
            include: {
              childVariant: {
                include: { product: true }
              }
            }
          }
        }
      });

      // 4. Create Variants
      if (variableProduct && createProductDto.variants?.length) {
        const usedSkus = new Set<string>();
        for (const v of createProductDto.variants) {
          const attrs = (v.attributes && typeof v.attributes === 'object')
            ? Object.fromEntries(
                Object.entries(v.attributes)
                  .filter(([, val]) => val != null && String(val).trim() !== '')
                  .map(([k, val]) => [k, String(val)]),
              )
            : {
                ...(v.color ? { Color: v.color } : {}),
                ...(v.size ? { Talle: v.size } : {}),
              };

          let sku = (v.sku || '').trim();
          if (!sku) {
            sku = await this.identifiersService.ensureUniqueVariantSku(finalSku, attrs);
          } else if (!(await this.identifiersService.validateSkuUniqueness(sku))) {
            throw new ConflictException(`El SKU ${sku} ya está en uso`);
          }
          while (usedSkus.has(sku.toUpperCase())) {
            sku = `${sku}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
          }
          usedSkus.add(sku.toUpperCase());

          await tx.productVariant.create({
            data: {
              productId: product.id,
              sku,
              barcode: (v.barcode || '').trim() || null,
              size: v.size,
              color: v.color,
              imageUrl: v.imageUrl,
              attributes: v.attributes || attrs,
              costPrice: v.costPrice || createProductDto.costPrice || 0,
              basePrice: v.basePrice ?? createProductDto.basePrice ?? 0,
              isActive: v.isActive !== false,
            },
          });
        }
      } else {
        // Simple / combo product: create one default variant
        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: finalSku,
            barcode: createProductDto.variants?.[0]?.barcode?.trim() || null,
            basePrice: createProductDto.basePrice || createProductDto.variants?.[0]?.basePrice || 0,
            costPrice: createProductDto.costPrice || 0,
            isActive: true
          }
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          brand: true,
          variants: true,
          comboLines: {
            include: {
              childVariant: {
                include: { product: true }
              }
            }
          }
        }
      });
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
    if (query.isPublished !== undefined) where.isPublished = query.isPublished === 'true';
    
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

  async publishAll() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { variants: { where: { isActive: true } } },
    });

    const publishableIds = products
      .filter(p => p.variants.some(v => v.basePrice > 0))
      .map(p => p.id);

    const res = await this.prisma.product.updateMany({
      where: { id: { in: publishableIds } },
      data: { isPublished: true },
    });
    return { success: true, count: res.count, skipped: products.length - res.count };
  }

  async getPublishReadiness(id: string) {
    const product = await this.findOne(id);
    const issues: string[] = [];
    const activeVariants = (product.variants || []).filter((v: any) => v.isActive);

    if (!activeVariants.length) issues.push('El producto no tiene variantes activas');
    if (!activeVariants.some((v: any) => v.basePrice > 0)) issues.push('Ninguna variante tiene precio de venta');
    if (!product.categoryId) issues.push('Falta categoría');
    if (!product.name?.trim()) issues.push('Falta nombre');

    return { ready: issues.length === 0, issues };
  }

  async duplicate(id: string) {
    const product = await this.findOne(id);
    const suffix = '-COPY';
    let newBaseSku = product.baseSku ? `${product.baseSku}${suffix}` : `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const skuExists = await this.prisma.product.findUnique({ where: { baseSku: newBaseSku } });
    if (skuExists) newBaseSku = `${newBaseSku}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.product.create({
        data: {
          name: `${product.name} (Copia)`,
          baseSku: newBaseSku,
          description: product.description,
          categoryId: product.categoryId,
          brandId: product.brandId,
          type: product.type,
          isVariable: product.isVariable,
          manageBatches: product.manageBatches,
          costPrice: product.costPrice,
          isActive: true,
          isPublished: false,
          images: product.images as any,
          metadata: product.metadata as any,
        },
      });

      for (const variant of product.variants || []) {
        let variantSku = `${variant.sku}${suffix}`;
        const exists = await tx.productVariant.findUnique({ where: { sku: variantSku } });
        if (exists) variantSku = `${variantSku}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        await tx.productVariant.create({
          data: {
            productId: copy.id,
            sku: variantSku,
            barcode: null,
            size: variant.size,
            color: variant.color,
            imageUrl: variant.imageUrl,
            costPrice: variant.costPrice,
            basePrice: variant.basePrice,
            isActive: true,
            attributes: variant.attributes as any,
          },
        });
      }

      return copy;
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: true,
        comboLines: {
          include: {
            childVariant: {
              include: { product: true }
            }
          }
        }
      }
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    // Re-validate foreign relations if they are being updated
    if (updateProductDto.categoryId) await this.categoriesService.findOne(updateProductDto.categoryId);
    if (updateProductDto.brandId) await this.brandsService.findOne(updateProductDto.brandId);

    // Load settings for POS validations
    const posSettings = await this.settingsService.getPosSettings();

    // POS Validations for Update
    const checkBrandId = updateProductDto.brandId !== undefined ? updateProductDto.brandId : product.brandId;
    if (posSettings.requireBrand && !checkBrandId) {
      throw new ConflictException('La Marca es obligatoria según la configuración de ventas.');
    }

    const checkDescription = updateProductDto.description !== undefined ? updateProductDto.description : product.description;
    if (posSettings.requireDescription && !checkDescription?.trim()) {
      throw new ConflictException('La Descripción es obligatoria según la configuración de ventas.');
    }

    if (posSettings.requireBarcode && updateProductDto.variants) {
      const hasMissingBarcode = updateProductDto.variants.some((v: any) => v.barcode !== undefined && !v.barcode?.trim());
      if (hasMissingBarcode) {
        throw new ConflictException('El Código de Barras no puede quedar vacío según la configuración de ventas.');
      }
    }

    if (posSettings.requireShippingDimensions) {
      const metadataToCheck = updateProductDto.metadata !== undefined
        ? updateProductDto.metadata
        : (product.metadata as any);
      if (!hasRequiredShippingDimensions(metadataToCheck)) {
        throw new ConflictException('Las dimensiones de envío (peso, ancho, alto, largo) son obligatorias según la configuración de ventas.');
      }
    }

    // 2b. POS Validations & USD Logic for Update
    if (updateProductDto.metadata?.usdCurrency) {
      const type = updateProductDto.metadata.usdCurrency;
      const rate = type === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;
      const costUsd = parseFloat(updateProductDto.metadata.costUsd || '0');
      if (rate && costUsd > 0) {
        updateProductDto.costPrice = costUsd * rate;
        if (updateProductDto.variants) {
          updateProductDto.variants = updateProductDto.variants.map((v: any) => ({
            ...v,
            costPrice: costUsd * rate
          }));
        }
      }
    }

    // Re-validate SKU uniqueness if it's changing
    if (updateProductDto.baseSku && updateProductDto.baseSku !== product.baseSku) {
      const exists = await this.prisma.product.findUnique({ where: { baseSku: updateProductDto.baseSku } });
      if (exists) throw new ConflictException('El SKU Base ya está en uso por otro producto');
    }

    const { variants, images, basePrice, comboLines, type, isVariable, ...data } = updateProductDto;
    const nextType = type !== undefined ? normalizeProductType({ type, isVariable }) : undefined;
    const effectiveType = nextType ?? product.type;
    const normalizedMetadata = updateProductDto.metadata
      ? normalizeMetadataWithDimensions(updateProductDto.metadata)
      : undefined;

    if (effectiveType === 'VARIABLE') {
      if (nextType === 'VARIABLE' && product.type !== 'VARIABLE') {
        const hasNewVariants = variants && variants.length > 0;
        const hasExisting = (product.variants?.filter(v => v.isActive).length ?? 0) > 0;
        if (!hasNewVariants && !hasExisting) {
          throw new ConflictException('Los productos variables requieren al menos una variante.');
        }
      }
      if (variants !== undefined && variants.length === 0) {
        throw new ConflictException('Los productos variables requieren al menos una variante activa.');
      }
    }
    if (effectiveType === 'COMBO' && comboLines !== undefined && comboLines.length === 0) {
      throw new ConflictException('Los productos combo requieren al menos un componente en la receta.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (effectiveType === 'COMBO') {
        if (comboLines !== undefined) {
          await tx.productComboLine.deleteMany({ where: { parentProductId: id } });
        }
      } else {
        await tx.productComboLine.deleteMany({ where: { parentProductId: id } });
      }

      const persistedImages = images !== undefined
        ? this.mediaService.persistImageRefs(images)
        : undefined;

      await tx.product.update({
        where: { id },
        data: {
          ...data,
          ...(nextType !== undefined ? { type: nextType, isVariable: syncIsVariableFlag(nextType) } : {}),
          ...(normalizedMetadata !== undefined ? { metadata: normalizedMetadata } : {}),
          ...(persistedImages !== undefined ? { images: persistedImages as any } : {}),
          comboLines: effectiveType === 'COMBO' && comboLines?.length ? {
            create: comboLines.map((cl: any) => ({
              childVariantId: cl.childVariantId,
              quantity: Number(cl.quantity) || 1,
            }))
          } : undefined
        },
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
            const finalSku = updateProductDto.baseSku || product.baseSku || 'PROD';
            const attrs = (variant.attributes && typeof variant.attributes === 'object')
              ? Object.fromEntries(
                  Object.entries(variant.attributes)
                    .filter(([, val]) => val != null && String(val).trim() !== '')
                    .map(([k, val]) => [k, String(val)]),
                )
              : {
                  ...(variant.color ? { Color: variant.color } : {}),
                  ...(variant.size ? { Talle: variant.size } : {}),
                };

            let sku = (variant.sku || '').trim();
            if (!sku) {
              sku = await this.identifiersService.ensureUniqueVariantSku(finalSku, attrs);
            }

            let barcode = (variant.barcode || '').trim() || null;
            if (!barcode) {
              const skuSettings = await this.settingsService.getSkuBarcodeSettings();
              if (skuSettings.barcodeAutoGenerate !== false) {
                barcode = await this.identifiersService.generateUniqueBarcode();
              }
            }

            await tx.productVariant.create({
              data: {
                productId: id,
                sku,
                barcode,
                size: variant.size,
                color: variant.color,
                imageUrl: variant.imageUrl,
                attributes: variant.attributes || attrs,
                costPrice: variant.costPrice || updateProductDto.costPrice || product.costPrice || 0,
                basePrice: variant.basePrice ?? updateProductDto.basePrice ?? 0,
                isActive: variant.isActive !== false,
              }
            });
          }
        }
        
        // If switched to simple, ensure at least one default variant exists
        const isNowVariable = updateProductDto.type !== undefined || updateProductDto.isVariable !== undefined
          ? isVariableProduct({ type: nextType ?? product.type, isVariable: updateProductDto.isVariable ?? product.isVariable })
          : isVariableProduct(product);
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

      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
          variants: true,
          comboLines: {
            include: {
              childVariant: {
                include: { product: true }
              }
            }
          }
        }
      });
    });
  }

  async findVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneVariant(id: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: { product: { include: { category: true, brand: true } } },
    });
    if (!variant) throw new NotFoundException(`Variante ${id} no encontrada`);
    return variant;
  }

  async createVariant(productId: string, data: any) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`);

    const skuSettings = await this.settingsService.getSkuBarcodeSettings();
    const attrs = (data.attributes && typeof data.attributes === 'object')
      ? Object.fromEntries(
          Object.entries(data.attributes)
            .filter(([, val]) => val != null && String(val).trim() !== '')
            .map(([k, val]) => [k, String(val)]),
        )
      : {
          ...(data.color ? { Color: data.color } : {}),
          ...(data.size ? { Talle: data.size } : {}),
        };

    let sku = (data.sku || '').trim();
    if (!sku) {
      sku = await this.identifiersService.ensureUniqueVariantSku(product.baseSku || 'PROD', attrs);
    } else if (!(await this.identifiersService.validateSkuUniqueness(sku))) {
      throw new ConflictException(`El SKU ${sku} ya está en uso`);
    }

    let barcode = (data.barcode || '').trim() || null;
    if (!barcode && skuSettings.barcodeAutoGenerate !== false) {
      barcode = await this.identifiersService.generateUniqueBarcode();
    }

    return this.prisma.productVariant.create({
      data: {
        ...data,
        productId,
        sku,
        barcode,
        attributes: data.attributes || attrs,
      },
    });
  }

  async updateVariant(id: string, data: any, changedBy?: string) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Variante ${id} no encontrada`);

    const updated = await this.prisma.productVariant.update({ where: { id }, data });

    if (data.basePrice !== undefined && data.basePrice !== existing.basePrice) {
      await this.priceHistoryService.recordChange({
        variantId: id,
        oldPrice: existing.basePrice,
        newPrice: data.basePrice,
        source: 'MANUAL',
        changedBy,
      });
    }

    return updated;
  }

  async deleteVariant(id: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: { comboUses: true },
    });
    if (!variant) throw new NotFoundException(`Variante ${id} no encontrada`);

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { variantId: id, physicalQuantity: { gt: 0 } },
    });
    if (stockLevels.length > 0) {
      throw new ConflictException(
        'No se puede eliminar la variante porque tiene stock en uno o más depósitos. Realice un ajuste de salida primero.',
      );
    }

    if (variant.comboUses.length > 0) {
      throw new ConflictException(
        'No se puede eliminar la variante porque forma parte de uno o más combos.',
      );
    }

    const salesCount = await this.prisma.orderLineItem.count({ where: { variantId: id } });
    if (salesCount > 0) {
      return this.prisma.productVariant.update({
        where: { id },
        data: { isActive: false },
      });
    }

    try {
      return await this.prisma.productVariant.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2003') {
        return this.prisma.productVariant.update({
          where: { id },
          data: { isActive: false },
        });
      }
      throw error;
    }
  }

  async generateCombinations(productId: string, dto: any) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`);

    const attributes = normalizeGenerateAttributes(dto);
    if (Object.keys(attributes).length === 0) {
      throw new BadRequestException(
        'Se requiere al menos un atributo con valores para generar variantes.',
      );
    }

    const combinations = cartesianCombinations(attributes);
    const skuPrefix = product.baseSku || productId.substring(0, 8);
    const basePrice = dto.basePrice ?? 0;
    const costPrice = dto.costPrice ?? product.costPrice ?? 0;
    const skuSettings = await this.settingsService.getSkuBarcodeSettings();
    const autoBarcode = skuSettings.barcodeAutoGenerate !== false;

    const usedSkus = new Set<string>();
    const created = [];

    for (const combo of combinations) {
      const { color, size } = extractColorAndSize(combo);
      let sku = await this.identifiersService.ensureUniqueVariantSku(skuPrefix, combo);
      while (usedSkus.has(sku.toUpperCase())) {
        sku = `${sku}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      }
      usedSkus.add(sku.toUpperCase());

      const barcode = autoBarcode
        ? await this.identifiersService.generateUniqueBarcode()
        : null;

      const variant = await this.prisma.productVariant.create({
        data: {
          productId,
          color,
          size,
          attributes: combo,
          basePrice,
          costPrice,
          sku,
          barcode,
          isActive: true,
        },
      });
      created.push(variant);
    }

    return created;
  }

  async remove(id: string) {
    const variantsForDelete = await this.prisma.productVariant.findMany({
      where: { productId: id },
      select: { id: true }
    });
    const variantIdsForDelete = variantsForDelete.map(v => v.id);

    // 1. Verificar si existen StockLevels con cantidad
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: {
        variantId: { in: variantIdsForDelete },
        physicalQuantity: { gt: 0 },
      },
    });

    if (stockLevels.length > 0) {
      throw new ConflictException(
        'No se puede eliminar el producto porque tiene stock en uno o más depósitos. Realice un ajuste de salida primero.'
      );
    }

    // 2. Transacción de eliminación
    return this.prisma.$transaction(async (tx) => {
      await tx.productComboLine.deleteMany({
        where: { parentProductId: id },
      });

      const variants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      });
      const variantIds = variants.map((v) => v.id);

      await tx.productComboLine.deleteMany({
        where: { childVariantId: { in: variantIds } },
      });

      await tx.stockLevel.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await tx.priceListEntry.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await tx.productVariant.deleteMany({
        where: { productId: id },
      });

      await tx.product.delete({
        where: { id },
      });

      return { success: true };
    });
  }

  async bulkValidate(dto: BulkValidateDto) {
    const validRows = [];
    const conflicts = [];

    // Gather all SKUs that are not empty
    const skus = dto.rows.map(r => r.sku).filter(s => !!s);
    
    // Find existing variants by SKU
    const existingVariants = await this.prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      include: { product: true }
    });
    
    const existingMap = new Map(existingVariants.map(v => [v.sku, v]));

    for (const row of dto.rows) {
      if (row.sku && existingMap.has(row.sku)) {
        conflicts.push({
          row,
          existingProduct: existingMap.get(row.sku)
        });
      } else {
        validRows.push(row);
      }
    }

    return { validRows, conflicts };
  }

  async bulkImport(dto: BulkImportDto) {
    return this.prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;

      // Ensure we have a default warehouse to place stock if needed
      let defaultWarehouse = await tx.warehouse.findFirst({
        where: { code: 'DEP-01' }
      });
      if (!defaultWarehouse) {
        defaultWarehouse = await tx.warehouse.findFirst();
      }

      // Group rows by product name
      const groupedProducts = new Map<string, any[]>();
      for (const row of dto.rows) {
        if (row.resolution === 'skip') continue;
        const name = row.name.trim();
        if (!groupedProducts.has(name)) {
          groupedProducts.set(name, []);
        }
        groupedProducts.get(name).push(row);
      }

      for (const [name, rows] of groupedProducts.entries()) {
        const firstRow = rows[0];

        // Resolve Category
        let categoryId = null;
        if (firstRow.category) {
          let cat = await tx.category.findFirst({ where: { name: firstRow.category } });
          if (!cat) {
            cat = await tx.category.create({ data: { name: firstRow.category } });
          }
          categoryId = cat.id;
        } else {
          let cat = await tx.category.findFirst({ where: { name: 'Sin Categoría' } });
          if (!cat) cat = await tx.category.create({ data: { name: 'Sin Categoría' } });
          categoryId = cat.id;
        }

        // Resolve Brand
        let brandId = null;
        if (firstRow.brand) {
          let br = await tx.brand.findFirst({ where: { name: firstRow.brand } });
          if (!br) {
            br = await tx.brand.create({ data: { name: firstRow.brand } });
          }
          brandId = br.id;
        }

        // Determine if variable product
        const isVariable = rows.length > 1 || firstRow.type?.toLowerCase() === 'variable' || (firstRow.variant && firstRow.variant !== 'Única' && firstRow.variant !== 'DUMMY');

        // Determine base SKU
        let baseSku = null;
        if (isVariable) {
          const skus = rows.map(r => r.sku).filter(s => !!s);
          if (skus.length > 0) {
            const parts = skus[0].split('-');
            if (parts.length > 1) {
              baseSku = parts[0];
            } else {
              baseSku = skus[0].replace(/-\d+$/, '');
            }
          }
        } else {
          baseSku = firstRow.sku;
        }

        if (!baseSku) {
          baseSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        }

        // Check if product exists by baseSku or name
        let product = await tx.product.findFirst({
          where: {
            OR: [
              { baseSku },
              { name }
            ]
          }
        });

        if (product) {
          product = await tx.product.update({
            where: { id: product.id },
            data: {
              name,
              categoryId,
              brandId,
              type: isVariable ? 'VARIABLE' : 'SINGLE',
              isVariable
            }
          });
        } else {
          product = await tx.product.create({
            data: {
              name,
              baseSku,
              categoryId,
              brandId,
              isActive: true,
              type: isVariable ? 'VARIABLE' : 'SINGLE',
              isVariable
            }
          });
          createdCount++;
        }

        // Process variants for this product
        for (const row of rows) {
          const sku = row.sku || `${baseSku}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase();
          const costPrice = row.costPrice || 0;
          const basePrice = row.basePrice || 0;
          const variantName = (!row.variant || row.variant === 'DUMMY' || row.variant === 'Única') ? null : row.variant;

          // Check if variant exists
          const existingVariant = await tx.productVariant.findUnique({ where: { sku } });
          
          let variantId: string;
          if (existingVariant && row.resolution === 'overwrite') {
            const updated = await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                barcode: row.barcode || null,
                costPrice,
                basePrice,
                size: variantName,
                isActive: true
              }
            });
            variantId = updated.id;
            updatedCount++;
          } else if (!existingVariant) {
            const created = await tx.productVariant.create({
              data: {
                productId: product.id,
                sku,
                barcode: row.barcode || null,
                costPrice,
                basePrice,
                size: variantName,
                isActive: true
              }
            });
            variantId = created.id;
          } else {
            variantId = existingVariant.id;
          }

          // Handle initial stock
          if (row.initialStock && row.initialStock > 0 && defaultWarehouse) {
            const existingStock = await tx.stockLevel.findFirst({
              where: {
                variantId,
                warehouseId: defaultWarehouse.id,
                batchId: null
              }
            });

            if (!existingStock || existingStock.physicalQuantity === 0) {
              const quantityToAdd = row.initialStock;

              await tx.inventoryMovement.create({
                data: {
                  variantId,
                  destinationWarehouseId: defaultWarehouse.id,
                  type: 'INITIAL_STOCK',
                  quantity: quantityToAdd,
                  unitCost: costPrice
                }
              });

              if (existingStock) {
                await tx.stockLevel.update({
                  where: { id: existingStock.id },
                  data: {
                    physicalQuantity: { increment: quantityToAdd },
                    availableQuantity: { increment: quantityToAdd }
                  }
                });
              } else {
                await tx.stockLevel.create({
                  data: {
                    variantId,
                    warehouseId: defaultWarehouse.id,
                    physicalQuantity: quantityToAdd,
                    availableQuantity: quantityToAdd
                  }
                });
              }
            }
          }
        }
      }

      return { success: true, createdCount, updatedCount };
    }, {
      timeout: 30000 // 30 seconds to allow massive CSV imports
    });
  }

  async clearCatalog() {
    const variantCount = await this.prisma.productVariant.count();
    const stockWithQty = await this.prisma.stockLevel.count({ where: { physicalQuantity: { gt: 0 } } });
    if (stockWithQty > 0) {
      throw new ConflictException(
        'No se puede vaciar el catálogo mientras exista stock físico. Realice ajustes de salida primero.',
      );
    }

    const openOrders = await this.prisma.saleOrder.count({
      where: { status: 'QUOTE' },
    });
    if (openOrders > 0) {
      throw new ConflictException(
        'No se puede vaciar el catálogo mientras existan órdenes de venta abiertas.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.priceListEntry.deleteMany();
      await tx.productComboLine.deleteMany();
      await tx.productBarcode.deleteMany();
      await tx.productBatch.deleteMany();
      await tx.stockLevel.deleteMany();
      await tx.productVariant.deleteMany();
      await tx.product.deleteMany();
      await tx.attributeValue.deleteMany();
      await tx.attribute.deleteMany();
      await tx.priceList.deleteMany();
      await tx.brand.deleteMany();
      await tx.category.deleteMany();
      return { success: true, deletedVariants: variantCount };
    });
  }

  async findAllVariants(search?: string) {
    const where: any = {};
    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { sku: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { barcodes: { some: { barcode: { contains: term, mode: 'insensitive' } } } },
        { product: { name: { contains: term, mode: 'insensitive' } } },
        { product: { baseSku: { contains: term, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.productVariant.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            comboLines: {
              include: {
                childVariant: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
      take: 50,
    });
  }

  async bulkUpdatePrices(dto: BulkUpdatePricesDto) {
    const { categoryId, brandId, percentage } = dto;
    const multiplier = 1 + (percentage / 100);

    return this.prisma.$transaction(async (tx) => {
      const where: any = {};
      if (categoryId) where.categoryId = categoryId;
      if (brandId) where.brandId = brandId;

      const products = await tx.product.findMany({ 
        where, 
        include: { variants: true } 
      });
      let updatedCount = 0;

      for (const product of products) {
        const newCost = Math.round((product.costPrice || 0) * multiplier);
        
        await tx.product.update({
          where: { id: product.id },
          data: { costPrice: newCost }
        });

        for (const variant of product.variants) {
          const vCost = Math.round((variant.costPrice || 0) * multiplier);
          const vBase = Math.round((variant.basePrice || 0) * multiplier);
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { costPrice: vCost, basePrice: vBase }
          });
          if (vBase !== variant.basePrice) {
            await this.priceHistoryService.recordChange({
              variantId: variant.id,
              oldPrice: variant.basePrice,
              newPrice: vBase,
              source: 'BULK',
            });
          }
        }
        updatedCount++;
      }
      return { success: true, updatedCount };
    });
  }

  async getPublicProducts(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 15;
    const skip = (page - 1) * pageSize;

    const where: any = { isPublished: true, isActive: true };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { baseSku: { contains: term, mode: 'insensitive' } },
        { brand: { name: { contains: term, mode: 'insensitive' } } },
        { category: { name: { contains: term, mode: 'insensitive' } } },
        { variants: { some: { sku: { contains: term, mode: 'insensitive' } } } },
        { variants: { some: { barcode: { contains: term, mode: 'insensitive' } } } },
        { variants: { some: { barcodes: { some: { barcode: { contains: term, mode: 'insensitive' } } } } } },
      ];
    }


    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          variants: {
            where: { isActive: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    const variantIds = data.flatMap(p => p.variants.map(v => v.id));
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { variantId: { in: variantIds } }
    });

    const stockByVariant = new Map<string, typeof stockLevels>();
    for (const stock of stockLevels) {
      const arr = stockByVariant.get(stock.variantId) || [];
      arr.push(stock);
      stockByVariant.set(stock.variantId, arr);
    }

    // Map the response to include computed availability and simple price list logic
    const mapped = data.map(p => {
      let lowestPrice = 0;
      let totalStock = 0;
      
      const mappedVariants = p.variants.map(v => {
        const variantStocks = stockByVariant.get(v.id) || [];
        const variantStock = variantStocks.reduce((sum, sl) => sum + sl.availableQuantity, 0);
        totalStock += variantStock;
        if (lowestPrice === 0 || v.basePrice < lowestPrice) {
          lowestPrice = v.basePrice;
        }
        return {
          id: v.id,
          sku: v.sku,
          price: v.basePrice,
          stock: variantStock,
          attributes: v.attributes,
        };
      });

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        category: p.category?.name,
        brand: p.brand?.name,
        lowestPrice,
        inStock: totalStock > 0,
        totalStock,
        variants: mappedVariants,
      };
    });

    return {
      data: mapped,
      total,
      page,
      pageSize,
    };
  }

  async getPublicProduct(id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, isPublished: true, isActive: true },
      include: {
        category: true,
        brand: true,
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!p) throw new NotFoundException('Producto no encontrado o no disponible en Tienda Web');

    const variantIds = p.variants.map(v => v.id);
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { variantId: { in: variantIds } }
    });

    const stockByVariant = new Map<string, typeof stockLevels>();
    for (const stock of stockLevels) {
      const arr = stockByVariant.get(stock.variantId) || [];
      arr.push(stock);
      stockByVariant.set(stock.variantId, arr);
    }

    let lowestPrice = 0;
    let totalStock = 0;
    
    const mappedVariants = p.variants.map(v => {
      const variantStocks = stockByVariant.get(v.id) || [];
      const variantStock = variantStocks.reduce((sum, sl) => sum + sl.availableQuantity, 0);
      totalStock += variantStock;
      if (lowestPrice === 0 || v.basePrice < lowestPrice) {
        lowestPrice = v.basePrice;
      }
      return {
        id: v.id,
        sku: v.sku,
        price: v.basePrice,
        stock: variantStock,
        attributes: v.attributes,
      };
    });

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      images: p.images,
      category: p.category?.name,
      brand: p.brand?.name,
      lowestPrice,
      inStock: totalStock > 0,
      totalStock,
      variants: mappedVariants,
    };
  }

  async priceCheck(
    rawCode: string,
    options?: { branchId?: string; priceListId?: string; customerId?: string },
  ) {
    const code = (rawCode || '').replace(/[\r\n\t]/g, '').trim();
    if (!code) {
      throw new BadRequestException('Debe ingresar un código de barras o SKU');
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code);

    // Search for matching variants or product by barcode, secondary barcode, SKU, baseSku, product name, or UUID
    const matchingVariants = await this.prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: { isActive: true },
        OR: [
          { barcode: { equals: code, mode: 'insensitive' } },
          { barcodes: { some: { barcode: { equals: code, mode: 'insensitive' } } } },
          { sku: { equals: code, mode: 'insensitive' } },
          { product: { baseSku: { equals: code, mode: 'insensitive' } } },
          { sku: { contains: code, mode: 'insensitive' } },
          { barcode: { contains: code, mode: 'insensitive' } },
          { product: { name: { contains: code, mode: 'insensitive' } } },
          ...(isUuid ? [{ id: code }, { productId: code }] : []),
        ],
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            variants: {
              where: { isActive: true },
              include: { barcodes: true },
              orderBy: { sku: 'asc' },
            },
          },
        },
        barcodes: true,
      },
      take: 25,
    });

    if (matchingVariants.length === 0) {
      throw new NotFoundException(`No se encontró ningún artículo para el código "${code}"`);
    }

    // Determine primary product (first matched variant's parent product)
    const primaryProduct = matchingVariants[0].product;
    const allProductVariants = primaryProduct.variants;
    const allVariantIds = allProductVariants.map(v => v.id);

    const [stockLevels, warehouses, pricingSettings, priceMap] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where: { variantId: { in: allVariantIds } },
      }),
      this.prisma.warehouse.findMany({
        include: { branch: true },
      }),
      this.settingsService.getPricingSettings(),
      this.pricingService.resolveVariantPricingBatch(
        allProductVariants.map(v => ({ id: v.id, basePrice: v.basePrice || 0, costPrice: v.costPrice || 0 })),
        options,
      ),
    ]);

    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    const stockByVariant = new Map<string, typeof stockLevels>();
    for (const stock of stockLevels) {
      const arr = stockByVariant.get(stock.variantId) || [];
      arr.push(stock);
      stockByVariant.set(stock.variantId, arr);
    }

    const formatVariant = (v: (typeof allProductVariants)[0]) => {
      const variantStocks = stockByVariant.get(v.id) || [];
      const totalAvailable = variantStocks.reduce((sum, s) => sum + s.availableQuantity, 0);
      const totalPhysical = variantStocks.reduce((sum, s) => sum + s.physicalQuantity, 0);
      const totalReserved = variantStocks.reduce((sum, s) => sum + s.reservedQuantity, 0);
      const pricing = priceMap.get(v.id) || {
        resolvedPrice: v.basePrice || 0,
        overridePrice: null,
        basePrice: v.basePrice || 0,
        priceListName: 'General',
        currency: 'ARS',
      };

      const allBarcodes = [v.barcode, ...(v.barcodes?.map(b => b.barcode) || [])].filter(Boolean) as string[];

      const isScanned = Boolean(
        v.barcode?.toLowerCase() === code.toLowerCase() ||
        v.sku?.toLowerCase() === code.toLowerCase() ||
        allBarcodes.some(b => b.toLowerCase() === code.toLowerCase()),
      );

      return {
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        barcode: v.barcode || null,
        barcodes: allBarcodes,
        size: v.size || null,
        color: v.color || null,
        attributes: (v.attributes || {}) as Record<string, string>,
        imageUrl: v.imageUrl || (Array.isArray(primaryProduct.images) ? (primaryProduct.images as string[])[0] : null),
        costPrice: v.costPrice || 0,
        basePrice: v.basePrice || 0,
        overridePrice: pricing.overridePrice,
        effectivePrice: pricing.resolvedPrice,
        isScannedMatch: isScanned,
        stock: {
          available: totalAvailable,
          physical: totalPhysical,
          reserved: totalReserved,
          byWarehouse: variantStocks.map(s => {
            const wh = warehouseMap.get(s.warehouseId);
            return {
              warehouseId: s.warehouseId,
              warehouseName: wh?.name || 'Depósito',
              branchId: s.branchId || wh?.branchId,
              branchName: wh?.branch?.name || 'Sucursal',
              availableQuantity: s.availableQuantity,
              physicalQuantity: s.physicalQuantity,
              reservedQuantity: s.reservedQuantity,
            };
          }),
        },
      };
    };

    const formattedVariants = allProductVariants.map(formatVariant);
    const matched = formattedVariants.find(v => v.isScannedMatch) || formattedVariants[0];

    const prices = formattedVariants.map(v => v.effectivePrice);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    const totalAvailable = formattedVariants.reduce((sum, v) => sum + v.stock.available, 0);
    const totalPhysical = formattedVariants.reduce((sum, v) => sum + v.stock.physical, 0);

    return {
      query: code,
      found: true,
      product: {
        id: primaryProduct.id,
        name: primaryProduct.name,
        baseSku: primaryProduct.baseSku || null,
        description: primaryProduct.description || null,
        type: primaryProduct.type,
        images: Array.isArray(primaryProduct.images) ? (primaryProduct.images as string[]) : [],
        category: primaryProduct.category ? { id: primaryProduct.category.id, name: primaryProduct.category.name } : null,
        brand: primaryProduct.brand ? { id: primaryProduct.brand.id, name: primaryProduct.brand.name } : null,
        costPrice: primaryProduct.costPrice || 0,
        isActive: primaryProduct.isActive,
      },
      matchedVariant: matched,
      variants: formattedVariants,
      pricingSummary: {
        minPrice,
        maxPrice,
        currency: 'ARS',
        priceListName: priceMap.get(matched.id)?.priceListName || 'General',
        priceListId: priceMap.get(matched.id)?.priceListId,
        vatDefaultPct: pricingSettings?.vatDefaultPct ?? 21,
        showPricesWithTax: pricingSettings?.showPricesWithTax ?? true,
      },
      stockSummary: {
        totalAvailable,
        totalPhysical,
        warehousesCount: warehouses.length,
      },
    };
  }
}
