import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_ROLE_PERMISSIONS } from '../src/domains/identity/constants/system-roles';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      permissions: {
        create: [{ action: 'manage', subject: 'all' }],
      },
    },
  });

  await prisma.permission.createMany({
    skipDuplicates: true,
    data: [{ action: 'manage', subject: 'all', roleId: adminRole.id }],
  });

  for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        permissions: { create: permissions },
      },
    });

    const permCount = await prisma.permission.count({ where: { roleId: role.id } });
    if (permCount === 0 && permissions.length) {
      await prisma.permission.createMany({
        data: permissions.map((p) => ({ ...p, roleId: role.id })),
      });
    }
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: { password: hashedPassword, fullName: 'Administrador' },
    create: {
      email: 'admin@erp.com',
      password: hashedPassword,
      fullName: 'Administrador',
      roleId: adminRole.id,
    },
  });

  const branch = await prisma.branch.upsert({
    where: { code: 'CENTRAL' },
    update: {},
    create: { name: 'Casa Central', code: 'CENTRAL', isMain: true },
  });

  await prisma.warehouse.upsert({
    where: { code: 'DEP-01' },
    update: {},
    create: { name: 'Depósito Principal', code: 'DEP-01', branchId: branch.id },
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
