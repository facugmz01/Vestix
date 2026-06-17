import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AddBarcodeDto } from './dto/add-barcode.dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          baseSku: dto.baseSku,
          description: dto.description,
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this base SKU already exists');
      }
      throw error;
    }
  }

  async addVariantToProduct(productId: string, dto: CreateVariantDto) {
    // Validate that the product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    try {
      return await this.prisma.productVariant.create({
        data: {
          productId,
          sku: dto.sku,
          barcode: dto.barcode, // primary barcode
          size: dto.size,
          color: dto.color,
          costPrice: dto.costPrice || 0,
          basePrice: dto.basePrice,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Variant with this SKU or barcode already exists');
      }
      throw error;
    }
  }

  async addBarcodeToVariant(variantId: string, dto: AddBarcodeDto) {
    try {
      return await this.prisma.productBarcode.create({
        data: {
          variantId,
          barcode: dto.barcode,
          type: dto.type || 'INTERNAL',
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Barcode already exists globally');
      }
      throw error;
    }
  }

  /**
   * Generates a flat, lightweight catalog snapshot for the POS offline database.
   */
  async findAllForPos() {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: { isActive: true },
      },
      select: {
        id: true,
        sku: true,
        barcode: true,
        basePrice: true,
        size: true,
        color: true,
        product: {
          select: {
            id: true,
            name: true,
            categoryId: true,
          },
        },
        barcodes: {
          select: {
            barcode: true,
          },
        },
      },
    });

    // Flatten data for Dexie.js
    return variants.map((v) => ({
      id: v.id,
      productId: v.product.id,
      name: v.product.name,
      categoryId: v.product.categoryId,
      sku: v.sku,
      primaryBarcode: v.barcode,
      allBarcodes: [v.barcode, ...v.barcodes.map((b) => b.barcode)].filter(Boolean),
      price: v.basePrice,
      size: v.size,
      color: v.color,
    }));
  }
}
