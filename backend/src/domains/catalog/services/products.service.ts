import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CategoriesService, BrandsService } from './taxonomy.service';
import { BulkValidateDto, BulkImportDto } from '../dto/bulk-product.dto';
import { BulkUpdatePricesDto } from '../dto/bulk-update-prices.dto';
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

    // 2. Load settings for POS validations and SKU generation
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const posSettings = (settings?.pos as any) || {};
    const skuSettings = (settings?.skuBarcode as any) || {};

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
    if (posSettings.requireBarcode) {
      const variants = createProductDto.variants || [];
      const hasMissingBarcode = variants.some(v => !v.barcode?.trim());
      // For simple products, we must check if there is a variant. If no variants are provided, we check if they passed barcode in the main dto? 
      // DTO doesn't have barcode at root, only in variants. So if requireBarcode is true, and it's simple, they MUST send at least 1 variant.
      if (hasMissingBarcode || variants.length === 0) {
        throw new ConflictException('El Código de Barras es obligatorio para el producto según la configuración de ventas.');
      }
    }
    if (posSettings.requireShippingDimensions) {
      const { weight, width, height, depth } = createProductDto.metadata || {};
      if (!weight || !width || !height || !depth) {
        throw new ConflictException('Las dimensiones de envío (peso, ancho, alto, largo) son obligatorias según la configuración de ventas.');
      }
    }

    // 2b. Base SKU Uniqueness & Generation
    let finalSku = createProductDto.baseSku;

    if (!finalSku) {
      if (skuSettings.skuAutoGenerate) {
        const prefix = skuSettings.skuPrefix || 'PROD-';
        const seq = parseInt(skuSettings.nextSkuSequence) || 1;
        finalSku = `${prefix}${seq.toString().padStart(4, '0')}`;
        
        await this.prisma.systemSettings.update({
          where: { id: 'default' },
          data: {
            skuBarcode: {
              ...skuSettings,
              nextSkuSequence: seq + 1
            }
          }
        });
      } else {
        finalSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      }
    }
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
          type: createProductDto.type || 'SINGLE',
          manageBatches: createProductDto.manageBatches || false,
          isVariable: createProductDto.isVariable || false,
          costPrice: createProductDto.costPrice || 0,
          isActive: true,
          isPublished: false,
          images: (createProductDto.images as any) || [],
          metadata: createProductDto.metadata || {},
          comboLines: createProductDto.type === 'COMBO' && createProductDto.comboLines?.length ? {
            create: createProductDto.comboLines.map(cl => ({
              childVariantId: cl.childVariantId,
              quantity: cl.quantity
            }))
          } : undefined
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

    // Load settings for POS validations
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const posSettings = (settings?.pos as any) || {};

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
      const newMetadata = updateProductDto.metadata !== undefined ? updateProductDto.metadata : (product.metadata as any);
      const { weight, width, height, depth } = newMetadata || {};
      if (!weight || !width || !height || !depth) {
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

    // We also extract basePrice if present so it doesn't try to save it on the Product model
    const { variants, images, basePrice, comboLines, ...data } = updateProductDto;

    return this.prisma.$transaction(async (tx) => {
      // Si el producto cambia a COMBO o actualiza sus líneas de combo, borramos las existentes y creamos las nuevas.
      if (data.type === 'COMBO' && comboLines !== undefined) {
        await tx.productComboLine.deleteMany({ where: { parentProductId: id } });
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...data,
          images: images as any,
          comboLines: data.type === 'COMBO' && comboLines ? {
            create: comboLines.map((cl: any) => ({
              childVariantId: cl.childVariantId,
              quantity: cl.quantity
            }))
          } : undefined
        },
        include: { category: true, brand: true, comboLines: true }
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
    // 1. Verificar si existen StockLevels con cantidad
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: {
        variant: { productId: id },
        quantity: { gt: 0 },
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

      for (const row of dto.rows) {
        if (row.resolution === 'skip') continue;

        // Resolve Category
        let categoryId = null;
        if (row.category) {
          let cat = await tx.category.findFirst({ where: { name: row.category } });
          if (!cat) {
            cat = await tx.category.create({ data: { name: row.category, description: 'Creada automáticamente por importador' } });
          }
          categoryId = cat.id;
        } else {
          let cat = await tx.category.findFirst({ where: { name: 'Sin Categoría' } });
          if (!cat) cat = await tx.category.create({ data: { name: 'Sin Categoría' } });
          categoryId = cat.id;
        }

        // Resolve Brand
        let brandId = null;
        if (row.brand) {
          let br = await tx.brand.findFirst({ where: { name: row.brand } });
          if (!br) {
            br = await tx.brand.create({ data: { name: row.brand } });
          }
          brandId = br.id;
        }

        // Determine SKU
        let sku = row.sku;
        if (!sku) {
          sku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        }

        const costPrice = row.costPrice || 0;
        const basePrice = row.basePrice || 0;

        // Check if exists
        const existingVariant = await tx.productVariant.findUnique({ where: { sku } });

        let variantId: string;

        if (existingVariant && row.resolution === 'overwrite') {
          // Update existing
          await tx.product.update({
            where: { id: existingVariant.productId },
            data: {
              name: row.name,
              categoryId,
              brandId,
            }
          });

          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              barcode: row.barcode || null,
              costPrice,
              basePrice,
            }
          });
          variantId = existingVariant.id;
          updatedCount++;
        } else if (!existingVariant) {
          // Create new Product and Variant
          const product = await tx.product.create({
            data: {
              name: row.name,
              baseSku: sku,
              categoryId,
              brandId,
              isActive: true,
              type: 'SINGLE'
            }
          });

          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku,
              barcode: row.barcode || null,
              costPrice,
              basePrice,
              isActive: true
            }
          });
          variantId = variant.id;
          createdCount++;
        } else {
          continue; // should not happen if skip is handled above
        }

        // Handle initial stock if specified
        if (row.initialStock && row.initialStock > 0 && defaultWarehouse) {
          // Check existing stock level to avoid re-adding if overwrite
          const existingStock = await tx.stockLevel.findFirst({
            where: {
              variantId,
              warehouseId: defaultWarehouse.id,
              batchId: null
            }
          });

          // Only add initial stock if it's newly created, OR if overwrite but there is NO stock yet
          if (!existingStock || existingStock.physicalQuantity === 0) {
            const quantityToAdd = row.initialStock;

            // Create Movement
            await tx.inventoryMovement.create({
              data: {
                variantId,
                destinationWarehouseId: defaultWarehouse.id,
                type: 'INITIAL_STOCK',
                quantity: quantityToAdd,
                unitCost: costPrice
              }
            });

            // Update Stock Level
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

      return { success: true, createdCount, updatedCount };
    }, {
      timeout: 30000 // 30 seconds to allow massive CSV imports
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
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { baseSku: { contains: query.search, mode: 'insensitive' } },
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
            include: { stockLevels: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Map the response to include computed availability and simple price list logic
    const mapped = data.map(p => {
      let lowestPrice = 0;
      let totalStock = 0;
      
      const mappedVariants = p.variants.map(v => {
        const variantStock = v.stockLevels.reduce((sum, sl) => sum + sl.availableQuantity, 0);
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
          include: { stockLevels: true },
        },
      },
    });

    if (!p) throw new NotFoundException('Producto no encontrado o no disponible en Tienda Web');

    let lowestPrice = 0;
    let totalStock = 0;
    
    const mappedVariants = p.variants.map(v => {
      const variantStock = v.stockLevels.reduce((sum, sl) => sum + sl.availableQuantity, 0);
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
}
