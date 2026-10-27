import { Injectable } from '@nestjs/common';
import { SkuGeneratorUtil } from './utils/sku-generator.util';
import { BarcodeGeneratorUtil } from './utils/barcode-generator.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import * as crypto from 'crypto';

@Injectable()
export class IdentifiersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

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

  /**
   * Generates the next sequential base SKU from skuBarcode settings (prefix + sequence).
   */
  async generateBaseSku(): Promise<string> {
    const skuSettings = await this.settingsService.getSkuBarcodeSettings();
    const prefix = skuSettings.skuPrefix || 'PROD-';
    let seq = skuSettings.nextSkuSequence || 1;
    let sku = `${prefix}${seq.toString().padStart(4, '0')}`;

    // Advance until unique (handles gaps / collisions)
    let attempts = 0;
    while (!(await this.validateSkuUniqueness(sku)) && attempts < 50) {
      seq += 1;
      sku = `${prefix}${seq.toString().padStart(4, '0')}`;
      attempts++;
    }

    await this.settingsService.updateSection(
      'skuBarcode',
      { ...skuSettings, nextSkuSequence: seq + 1 },
      'system',
    );

    return sku;
  }

  async generateVariantSku(
    productId: string,
    attributes: string[] | Record<string, string> = [],
  ): Promise<string> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    const base = product?.baseSku || 'PROD';

    let sku: string;
    if (attributes && !Array.isArray(attributes) && typeof attributes === 'object') {
      sku = SkuGeneratorUtil.generateVariantSku(base, attributes);
    } else {
      const attrList = Array.isArray(attributes) ? attributes.filter(Boolean) : [];
      const cleaned = attrList
        .map(a => SkuGeneratorUtil.formatAttributeTrait(a))
        .filter(Boolean);
      sku = cleaned.length ? `${base}-${cleaned.join('-')}` : base;
    }

    return this.ensureUniqueSku(sku);
  }

  /**
   * Builds a deterministic variant SKU from base + attributes, appending a short
   * random suffix only when the candidate already exists.
   */
  async ensureUniqueVariantSku(baseSku: string, attributes: Record<string, string> = {}): Promise<string> {
    const sku = SkuGeneratorUtil.generateVariantSku(baseSku, attributes);
    return this.ensureUniqueSku(sku);
  }

  /** Appends a short random suffix until the SKU is unique across products and variants. */
  async ensureUniqueSku(candidate: string): Promise<string> {
    let sku = candidate;
    let attempts = 0;
    while (!(await this.validateSkuUniqueness(sku)) && attempts < 20) {
      sku = `${candidate}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      attempts++;
    }
    return sku;
  }

  async validateBarcodeUniqueness(barcode: string): Promise<boolean> {
    if (!barcode?.trim()) return true;
    const cleanBarcode = barcode.trim();
    const existingVariant = await this.prisma.productVariant.findFirst({
      where: { barcode: { equals: cleanBarcode, mode: 'insensitive' } },
    });
    if (existingVariant) return false;
    const existingAlt = await this.prisma.productBarcode.findFirst({
      where: { barcode: { equals: cleanBarcode, mode: 'insensitive' } },
    });
    return !existingAlt;
  }

  async validateSkuUniqueness(sku: string): Promise<boolean> {
    if (!sku?.trim()) return true;
    const cleanSku = sku.trim();
    const existingProduct = await this.prisma.product.findFirst({
      where: { baseSku: { equals: cleanSku, mode: 'insensitive' } },
    });
    if (existingProduct) return false;
    const existingVariant = await this.prisma.productVariant.findFirst({
      where: { sku: { equals: cleanSku, mode: 'insensitive' } },
    });
    return !existingVariant;
  }
}
