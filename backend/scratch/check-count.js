const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://erp_admin:84gi5ZKWfpHSFmZ@127.0.0.1:5433/erp_prod',
});

async function checkCount() {
  const productsCount = await prisma.product.count();
  const variantsCount = await prisma.productVariant.count();
  console.log(`\n--- Conteo real en la Base de Datos (Cloud) ---`);
  console.log(`Productos totales: ${productsCount}`);
  console.log(`Variantes totales: ${variantsCount}`);
  
  // Revisar si están inactivos, borradores, etc.
  const activeCount = await prisma.product.count({ where: { isActive: true } });
  const publishedCount = await prisma.product.count({ where: { isPublished: true } });
  console.log(`\n--- Estado ---`);
  console.log(`Activos: ${activeCount}`);
  console.log(`Publicados: ${publishedCount}`);

  // Revisar cuántos tienen deletedAt si existiera (no existe según el schema, pero por las dudas)
  
  await prisma.$disconnect();
}
checkCount().catch(console.error);
