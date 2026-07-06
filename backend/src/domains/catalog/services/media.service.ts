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
        const match = img.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!match) return img;
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const filename = `migrated-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        writeFileSync(join(this.uploadDir, filename), buffer);
        migratedImages++;
        return this.buildProductImageUrl(filename);
      });

      await this.prisma.product.update({ where: { id: product.id }, data: { images: nextImages } });
      migratedProducts++;
    }

    return { migratedProducts, migratedImages };
  }
}
