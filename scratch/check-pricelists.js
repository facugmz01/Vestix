const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching PriceLists count and sample...');
    const count = await prisma.priceList.count();
    console.log('Count:', count);
    
    const samples = await prisma.priceList.findMany({ take: 3 });
    console.log('Sample PriceLists:', JSON.stringify(samples, null, 2));

    const columns = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'catalog' AND table_name = 'PriceList';`
    );
    console.log('Columns in PriceList:', columns);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
