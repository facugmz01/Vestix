import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Inicializando datos de producción...');

  // ── Variables de entorno ──────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@vestix.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName     = process.env.ADMIN_NAME     || 'Administrador';

  const companyName    = process.env.COMPANY_NAME    || 'Mi Empresa';
  const companyCuit    = process.env.COMPANY_CUIT    || '';
  const companyAddress = process.env.COMPANY_ADDRESS || '';
  const companyPhone   = process.env.COMPANY_PHONE   || '';
  const companyEmail   = process.env.COMPANY_EMAIL   || '';

  // ── 1. Rol SUPER_ADMIN ───────────────────────────────────────
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
  console.log('✅ Rol SUPER_ADMIN listo');

  // ── 2. Roles adicionales ─────────────────────────────────────
  const roles = ['MANAGER', 'CASHIER', 'WAREHOUSE', 'VIEWER'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log('✅ Roles adicionales creados');

  // ── 3. Sucursal principal ────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { code: 'CENTRAL' },
    update: {
      name: companyName + ' - Casa Central',
      address: companyAddress,
      phone: companyPhone,
      settings: {
        taxId: companyCuit,
        companyName: companyName,
        companyEmail: companyEmail,
        companyPhone: companyPhone,
        companyAddress: companyAddress,
        posReceiptHeader: companyName,
        posReceiptFooter: `CUIT: ${companyCuit} | ${companyAddress}`,
      },
    },
    create: {
      name: companyName + ' - Casa Central',
      code: 'CENTRAL',
      address: companyAddress,
      phone: companyPhone,
      isMain: true,
      settings: {
        taxId: companyCuit,
        companyName: companyName,
        companyEmail: companyEmail,
        companyPhone: companyPhone,
        companyAddress: companyAddress,
        posReceiptHeader: companyName,
        posReceiptFooter: `CUIT: ${companyCuit} | ${companyAddress}`,
      },
    },
  });
  console.log(`✅ Sucursal "${branch.name}" lista`);

  // ── 4. Depósito principal ────────────────────────────────────
  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { branchId: branch.id },
  });
  if (!existingWarehouse) {
    await prisma.warehouse.create({
      data: {
        name: 'Depósito Principal',
        code: 'DEP-01',
        type: 'STORAGE',
        branchId: branch.id,
      },
    });
    console.log('✅ Depósito principal creado');
  }

  // ── 5. Caja registradora por defecto ─────────────────────────
  const existingRegister = await prisma.cashRegister.findFirst({
    where: { branchId: branch.id },
  });
  if (!existingRegister) {
    await prisma.cashRegister.create({
      data: {
        name: 'Caja 1',
        branchId: branch.id,
        isActive: true,
      },
    });
    console.log('✅ Caja registradora creada');
  }

  // ── 6. Métodos de pago por defecto ───────────────────────────
  const paymentMethods = [
    { name: 'Efectivo', type: 'CASH', isActive: true },
    { name: 'Tarjeta de Débito', type: 'DEBIT_CARD', isActive: true },
    { name: 'Tarjeta de Crédito', type: 'CREDIT_CARD', isActive: true },
    { name: 'Transferencia Bancaria', type: 'BANK_TRANSFER', isActive: true },
    { name: 'MercadoPago', type: 'DIGITAL_WALLET', isActive: true },
  ];
  for (const pm of paymentMethods) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { name: pm.name },
    });
    if (!existing) {
      await prisma.paymentMethod.create({ data: pm });
    }
  }
  console.log('✅ Métodos de pago configurados');

  // ── 7. Cuentas financieras base ──────────────────────────────
  const accounts = [
    { name: 'Caja Principal', type: 'CASH', currency: 'ARS', balance: 0, branchId: branch.id },
    { name: 'Cuenta Bancaria', type: 'BANK', currency: 'ARS', balance: 0, branchId: branch.id },
  ];
  for (const acc of accounts) {
    const existing = await prisma.financialAccount.findFirst({
      where: { name: acc.name, branchId: branch.id },
    });
    if (!existing) {
      await prisma.financialAccount.create({ data: acc });
    }
  }
  console.log('✅ Cuentas financieras creadas');

  // ── 8. Usuario Super Admin ───────────────────────────────────
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      fullName: adminName,
      roleId: adminRole.id,
      branchId: branch.id,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      fullName: adminName,
      roleId: adminRole.id,
      branchId: branch.id,
    },
  });
  console.log(`✅ Super Admin creado: ${adminEmail}`);

  // ── 9. Store Settings (Tienda Online) ────────────────────────
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      storeName: companyName,
    },
    create: {
      id: 'default',
      storeName: companyName,
      primaryColor: '#10b981',
      heroTitle: `Bienvenidos a ${companyName}`,
      heroSubtitle: 'Encontrá los mejores productos al mejor precio',
    },
  });
  console.log('✅ Configuración de tienda online lista');

  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('  ✅ Inicialización completada exitosamente');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Empresa:  ${companyName}`);
  console.log(`  CUIT:     ${companyCuit || '(no configurado)'}`);
  console.log('══════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la inicialización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
