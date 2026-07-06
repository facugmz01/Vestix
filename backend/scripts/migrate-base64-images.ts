#!/usr/bin/env ts-node
/**
 * Migrates product images stored as base64 data URLs in JSON to files under uploads/products/.
 * Usage: npx ts-node backend/scripts/migrate-base64-images.ts
 */
import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const uploadDir = join(process.cwd(), 'uploads', 'products');

function isBase64Image(url: string): boolean {
  return typeof url === 'string' && url.startsWith('data:image/');
}

function saveBase64ToFile(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const filename = `migrated-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  writeFileSync(join(uploadDir, filename), buffer);
  return `/uploads/products/${filename}`;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, images: true } });
  let migratedProducts = 0;
  let migratedImages = 0;

  for (const product of products) {
    const images = Array.isArray(product.images) ? (product.images as string[]) : [];
    if (!images.some(isBase64Image)) continue;

    const nextImages = images.map(img => {
      if (!isBase64Image(img)) return img;
      const url = saveBase64ToFile(img);
      if (url) migratedImages++;
      return url || img;
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { images: nextImages },
    });
    migratedProducts++;
    console.log(`Migrated images for product: ${product.name}`);
  }

  console.log(`Done. Products updated: ${migratedProducts}, images migrated: ${migratedImages}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
