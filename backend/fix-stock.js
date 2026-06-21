/**
 * FIX STOCK - migra el stock desde variation_location_details
 * haciendo el lookup por SKU directamente en el ERP (sin depender del variantMap).
 */
const { PrismaClient } = require('@prisma/client');
const mysql2 = require('mysql2/promise');

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://erp_admin:84gi5ZKWfpHSFmZ@127.0.0.1:5433/erp_prod',
});

const MYSQL_CONFIG = {
  host: '127.0.0.1', user: 'ultimatepos', password: 'ultimatepos', database: 'ultimatepos',
};

async function fixStock() {
  const db = await mysql2.createConnection(MYSQL_CONFIG);
  console.log('✅ Conectado\n');

  // Obtener warehouse
  const warehouse = await prisma.warehouse.findFirst({ orderBy: { createdAt: 'asc' } });
  const branch = await prisma.branch.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!warehouse || !branch) throw new Error('No hay warehouse/branch');
  console.log(`Warehouse: ${warehouse.name} | Branch: ${branch.name}\n`);

  // Obtener el stock desde MySQL:
  // JOIN con variations para obtener el sub_sku (que es el SKU en el ERP)
  const [stockRows] = await db.query(
    `SELECT v.sub_sku, v.id as variation_id, SUM(vld.qty_available) as total_qty
     FROM variation_location_details vld
     INNER JOIN variations v ON vld.variation_id = v.id AND v.deleted_at IS NULL
     INNER JOIN products p ON v.product_id = p.id AND p.is_inactive = 0
     GROUP BY v.id, v.sub_sku
     HAVING SUM(vld.qty_available) > 0`
  );

  console.log(`📊 ${stockRows.length} variantes con stock > 0\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const row of stockRows) {
    const sku = row.sub_sku;
    if (!sku || sku === 'NULL' || sku === '') { skipped++; continue; }

    const qty = Math.max(0, Math.round(parseFloat(row.total_qty) || 0));
    if (qty === 0) { skipped++; continue; }

    // Buscar la variante en el ERP por SKU
    const variant = await prisma.productVariant.findUnique({ where: { sku } });
    if (!variant) {
      console.log(`  ⚠️  SKU "${sku}" no encontrado en ERP`);
      notFound++;
      continue;
    }

    try {
      const existing = await prisma.stockLevel.findFirst({
        where: {
          variantId: variant.id,
          warehouseId: warehouse.id,
          batchId: null,
        }
      });

      if (existing) {
        await prisma.stockLevel.update({
          where: { id: existing.id },
          data: { physicalQuantity: qty, availableQuantity: qty }
        });
        updated++;
      } else {
        await prisma.stockLevel.create({
          data: {
            variantId: variant.id,
            warehouseId: warehouse.id,
            branchId: branch.id,
            physicalQuantity: qty,
            reservedQuantity: 0,
            availableQuantity: qty,
          }
        });
        created++;
      }
    } catch (e) {
      console.warn(`  ⚠️  Error en SKU "${sku}": ${e.message}`);
      skipped++;
    }
  }

  console.log('\n═══════════════════════════════════');
  console.log(`✅ Stock levels creados:    ${created}`);
  console.log(`🔄 Stock levels actualizados: ${updated}`);
  console.log(`❌ SKUs no encontrados:      ${notFound}`);
  console.log(`⏭️  Omitidos:               ${skipped}`);
  console.log('═══════════════════════════════════\n');

  await db.end();
  await prisma.$disconnect();
}

fixStock().catch(e => { console.error('Error:', e.message); process.exit(1); });
