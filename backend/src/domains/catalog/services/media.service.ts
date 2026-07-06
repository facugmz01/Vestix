import { Injectable, BadRequestException } from '@nestjs/common';
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
}
