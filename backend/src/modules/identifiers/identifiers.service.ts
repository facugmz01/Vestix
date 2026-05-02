import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { SkuGeneratorUtil } from './utils/sku-generator.util';
import { BarcodeGeneratorUtil } from './utils/barcode-generator.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class IdentifiersService {
  constructor(private readonly prisma: PrismaService) {}

  private internalItemCounter = 1;

  async generateUniqueBarcode(): Promise<string> {
    let isUnique = false;
    let barcode = '';
    let attempts = 0;

    // Use a random starting point for the counter to avoid collisions if multiple instances restart
    if (this.internalItemCounter === 1) {
      this.internalItemCounter = Math.floor(Math.random() * 100000);
    }

    while (!isUnique && attempts < 10) {
      barcode = BarcodeGeneratorUtil.generateInternalEan13(this.internalItemCounter++);
      isUnique = await this.validateBarcodeUniqueness(barcode);
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Fatal: Failed to generate a unique barcode after 10 database attempts.');
    }

    return barcode;
  }

  async generateVariantSku(productId: string, attributes: string[] = []): Promise<string> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    const base = product?.baseSku || 'PROD';
    const suffix = attributes.join('-').toUpperCase();
    
    let sku = suffix ? `${base}-${suffix}` : base;
    let isUnique = await this.validateSkuUniqueness(sku);
    
    if (!isUnique) {
      sku = `${sku}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    }
    
    return sku;
  }

  async validateBarcodeUniqueness(barcode: string): Promise<boolean> {
    const existing = await this.prisma.productVariant.findFirst({ where: { barcode } });
    return !existing;
  }

  async validateSkuUniqueness(sku: string): Promise<boolean> {
    const existingProduct = await this.prisma.product.findFirst({ where: { baseSku: sku } });
    const existingVariant = await this.prisma.productVariant.findFirst({ where: { sku } });
    return !existingProduct && !existingVariant;
  }
}
