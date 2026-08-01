import { Injectable, BadRequestException } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class MediaService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'products');

  constructor(private readonly prisma: PrismaService) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  buildProductImageUrl(filename: string): string {
    return `/uploads/products/${filename}`;
  }

  /**
   * Persist a data-URL image to disk and return the public `/uploads/...` path.
   * Non-data-URL strings are returned unchanged.
   */
  persistDataUrl(img: string): string {
    if (typeof img !== 'string' || !img.startsWith('data:image/')) return img;
    const match = img.match(/^data:image\/([\w+.-]+);base64,(.+)$/);
    if (!match) return img;

    const rawExt = match[1].toLowerCase().replace('jpeg', 'jpg').split('+')[0];
    const ext = ['jpg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length) return img;

    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    writeFileSync(join(this.uploadDir, filename), buffer);
    return this.buildProductImageUrl(filename);
  }

  /** Convert any mix of data-URLs and remote paths into filesystem-backed URLs. */
  persistImageRefs(images: unknown): string[] {
    if (!Array.isArray(images)) return [];
    return images
      .filter((img): img is string => typeof img === 'string' && img.length > 0)
      .map((img) => this.persistDataUrl(img));
  }

  async addProductImage(productId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const url = this.buildProductImageUrl(file.filename);
    const images = Array.isArray(product.images) ? [...(product.images as string[])] : [];
    images.push(url);

    await this.prisma.product.update({
      where: { id: productId },
      data: { images },
    });

    return { url };
  }

  async removeProductImage(productId: string, imageUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const currentImages = Array.isArray(product.images) ? (product.images as string[]) : [];
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
      const images = Array.isArray(product.images) ? (product.images as string[]) : [];
      const hasBase64 = images.some(img => typeof img === 'string' && img.startsWith('data:image/'));
      if (!hasBase64) continue;

      const nextImages = images.map(img => {
        if (typeof img !== 'string' || !img.startsWith('data:image/')) return img;
        migratedImages++;
        return this.persistDataUrl(img);
      });

      await this.prisma.product.update({ where: { id: product.id }, data: { images: nextImages } });
      migratedProducts++;
    }

    return { migratedProducts, migratedImages };
  }
}
