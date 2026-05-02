import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Roles and Permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN' }
  });

  await prisma.permission.createMany({
    skipDuplicates: true,
    data: [
      { id: crypto.randomUUID(), action: 'manage', subject: 'all', roleId: adminRole.id }
    ]
  });

  // 2. Default User
  await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      password: 'HASHED_PASSWORD_MOCK', // In real prod, this is hashed via bcrypt
      roleId: adminRole.id
    }
  });

  // 3. Main Branch & Warehouse
  const branch = await prisma.branch.create({
    data: { name: 'Casa Central' }
  });

  const warehouse = await prisma.warehouse.create({
    data: { name: 'Depósito Principal', branchId: branch.id }
  });

  // 4. Base Catalog Item
  const product = await prisma.product.create({
    data: { name: 'Remera Básica', categoryId: 'cat-remeras' }
  });

  await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: 'REM-BAS-BLA-M',
      basePrice: 15000.00
    }
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
