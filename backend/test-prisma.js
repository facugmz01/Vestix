const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    console.log('Categories:', cats);
    
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
    console.log('Brands:', brands);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
