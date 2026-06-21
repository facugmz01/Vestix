const { PrismaClient } = require('@prisma/client');
const mysql2 = require('mysql2/promise');

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://erp_admin:84gi5ZKWfpHSFmZ@127.0.0.1:5433/erp_prod',
});

const MYSQL_CONFIG = {
  host: '127.0.0.1', user: 'ultimatepos', password: 'ultimatepos', database: 'ultimatepos',
};

async function migrateImages() {
  const db = await mysql2.createConnection(MYSQL_CONFIG);
  
  // 1. Obtener productos con imagen
  const [products] = await db.query(
    `SELECT id, name, sku, image FROM products WHERE image IS NOT NULL AND image != '' AND is_inactive = 0`
  );
  
  let updatedProducts = 0;
  for (const p of products) {
    let baseSku = (p.sku && p.sku !== 'NULL' && p.sku !== '') ? p.sku : `UP-${p.id}`;
    
    // El frontend espera URLs de imagen, si las copiamos a /uploads/img/ serán /uploads/img/nombre_archivo.png
    const imgUrl = `/uploads/img/${p.image}`;
    const imagesJson = JSON.stringify([imgUrl]);

    try {
      // Buscar el producto en ERP y actualizarlo
      const erpProduct = await prisma.product.findFirst({
        where: { baseSku }
      });
      
      if (!erpProduct) {
        const erpProductByName = await prisma.product.findFirst({ where: { name: p.name } });
        if (erpProductByName) {
          await prisma.product.update({
            where: { id: erpProductByName.id },
            data: { images: JSON.parse(imagesJson) }
          });
          updatedProducts++;
        }
      } else {
        await prisma.product.update({
          where: { id: erpProduct.id },
          data: { images: JSON.parse(imagesJson) }
        });
        updatedProducts++;
      }
    } catch (e) {
      console.warn(`Error updating product ${baseSku}:`, e.message);
    }
  }

  // 2. Obtener variaciones con imagen desde media
  const [media] = await db.query(
    `SELECT m.file_name, v.sub_sku, v.id as var_id 
     FROM media m 
     INNER JOIN variations v ON m.model_id = v.id 
     WHERE m.model_type = 'App\\\\Variation'`
  );

  let updatedVariants = 0;
  for (const m of media) {
    const sku = m.sub_sku;
    if (!sku) continue;
    
    const imgUrl = `/uploads/media/${m.file_name}`;
    
    try {
      const erpVariant = await prisma.productVariant.findUnique({
        where: { sku }
      });
      
      if (erpVariant) {
        await prisma.productVariant.update({
          where: { id: erpVariant.id },
          data: { imageUrl: imgUrl }
        });
        updatedVariants++;
      }
    } catch(e) {
      // ignore
    }
  }

  console.log(`✅ ${updatedProducts} productos actualizados con imagenes`);
  console.log(`✅ ${updatedVariants} variantes actualizadas con imagenes`);
  
  await db.end();
  await prisma.$disconnect();
}

migrateImages().catch(console.error);
