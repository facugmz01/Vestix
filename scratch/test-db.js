const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing SaleOrder query...');
    const count = await prisma.saleOrder.count();
    console.log('Count:', count);
    
    const sample = await prisma.saleOrder.findFirst();
    console.log('Sample Order:', sample);
    
    console.log('Success!');
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
