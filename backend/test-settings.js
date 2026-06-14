require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      general: { companyName: 'Old Name' }
    }
  });

  const current = await prisma.systemSettings.findUnique({ where: { id: 'default' }});
  console.log('Current General:', current.general);

  // Update
  const dto = { general: { companyName: 'New Name', phone: '123' } };
  const updated = await prisma.systemSettings.update({
    where: { id: 'default' },
    data: {
      general: { ...current.general, ...dto.general }
    }
  });
  console.log('Updated General:', updated.general);

  await prisma.$disconnect();
}

run();
