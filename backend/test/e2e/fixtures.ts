import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface CheckoutFixtures {
  branchId: string;
  variantId: string;
  sku: string;
}

const FIXTURE_SKU = 'E2E-SMOKE-SKU';

export async function ensureCheckoutFixtures(
  prisma: PrismaClient,
): Promise<CheckoutFixtures> {
  const branch = await prisma.branch.findFirst({
    where: { code: 'CENTRAL' },
  });
  if (!branch) {
    throw new Error('Seed branch CENTRAL not found — run npm run seed');
  }

  const category = await prisma.category.upsert({
    where: { name: 'E2E Test Category' },
    update: {},
    create: { name: 'E2E Test Category' },
  });

  let variant = await prisma.productVariant.findUnique({
    where: { sku: FIXTURE_SKU },
  });

  if (!variant) {
    const product = await prisma.product.create({
      data: {
        name: 'E2E Smoke Product',
        categoryId: category.id,
        type: 'SINGLE',
        isActive: true,
      },
    });

    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: FIXTURE_SKU,
        basePrice: 100,
        costPrice: 50,
        isActive: true,
      },
    });
  }

  return {
    branchId: branch.id,
    variantId: variant.id,
    sku: FIXTURE_SKU,
  };
}

export function newOrderId(): string {
  return randomUUID();
}
