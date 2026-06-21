const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://erp_admin:84gi5ZKWfpHSFmZ@127.0.0.1:5433/erp_prod',
});

async function undoImages() {
  try {
    console.log('Revirtiendo imágenes de productos...');
    const pRes = await prisma.product.updateMany({
      data: {
        images: []
      }
    });
    console.log(`✅ ${pRes.count} productos limpiados (images = []).`);

    console.log('Revirtiendo imágenes de variantes...');
    const vRes = await prisma.productVariant.updateMany({
      data: {
        imageUrl: null
      }
    });
    console.log(`✅ ${vRes.count} variantes limpiadas (imageUrl = null).`);

  } catch (error) {
    console.error('Error al revertir imágenes:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

undoImages();
