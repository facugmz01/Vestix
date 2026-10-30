import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { sanitizeImageUrl, parseProductImages } from '../utils/product-image.util';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads', 'products');

  constructor(private readonly prisma: PrismaService) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async onModuleInit() {
    try {
      // Auto-heal dirty data in product variant imageUrls (such as "/" left by bad migration scripts)
      if (this.prisma?.$executeRawUnsafe) {
        await this.prisma.$executeRawUnsafe(`
          UPDATE catalog."ProductVariant"
          SET "imageUrl" = NULL
          WHERE "imageUrl" = '/' OR "imageUrl" = '' OR "imageUrl" = 'null' OR "imageUrl" = 'undefined';
        `);
      }
    } catch (err: any) {
      this.logger.warn(`Could not run automatic variant imageUrl cleanup: ${err?.message}`);
    }
  }

  buildProductImageUrl(filename: string): string {
    return `/uploads/products/${filename}`;
  }

  /**
   * Persist a data-URL image to disk and return the public `/uploads/...` path.
   * Non-data-URL strings are normalized and returned if valid.
   */
  persistDataUrl(img: string): string {
    if (typeof img !== 'string') return '';
    const trimmed = img.trim();
    if (!trimmed || trimmed === '/' || trimmed === 'null' || trimmed === 'undefined') return '';

    if (!trimmed.startsWith('data:image/')) {
      return sanitizeImageUrl(trimmed) || '';
    }

    const match = trimmed.match(/^data:image\/([\w+.-]+);base64,(.+)$/);
    if (!match) return '';

    const rawExt = match[1].toLowerCase().replace('jpeg', 'jpg').split('+')[0];
    const ext = ['jpg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length) return '';

    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    writeFileSync(join(this.uploadDir, filename), buffer);
    return this.buildProductImageUrl(filename);
  }

  /** Convert any mix of data-URLs and remote paths into filesystem-backed URLs. */
  persistImageRefs(images: unknown): string[] {
    if (!images) return [];
    let list: unknown[] = [];
    if (Array.isArray(images)) {
      list = images;
    } else if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) list = parsed;
        else list = [parsed];
      } catch {
        list = [images];
      }
    }

    return list
      .map((img) => (typeof img === 'string' ? this.persistDataUrl(img) : ''))
      .filter((url): url is string => typeof url === 'string' && url.length > 0 && url !== '/');
  }

  async addProductImage(productId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const url = this.buildProductImageUrl(file.filename);
    const images = parseProductImages(product.images);
    if (!images.includes(url)) {
      images.push(url);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { images },
    });

    return { url };
  }

  async removeProductImage(productId: string, imageUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const currentImages = parseProductImages(product.images);
    const images = currentImages.filter(img => img !== imageUrl);
    await this.prisma.product.update({
      where: { id: productId },
      data: { images },
    });
    return { success: true };
  }

  async migrateBase64Images() {
    const products = await this.prisma.product.findMany({ select: { id: true, name: true, images: true } });
    let migratedProducts = 0;
    let migratedImages = 0;

    for (const product of products) {
      const images = parseProductImages(product.images);
      const hasBase64 = images.some(img => typeof img === 'string' && img.startsWith('data:image/'));
      if (!hasBase64) continue;

      const nextImages = images.map(img => {
        if (typeof img !== 'string' || !img.startsWith('data:image/')) return img;
        migratedImages++;
        return this.persistDataUrl(img);
      }).filter(Boolean);

      await this.prisma.product.update({ where: { id: product.id }, data: { images: nextImages } });
      migratedProducts++;
    }

    return { migratedProducts, migratedImages };
  }
}
