import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Analizando inconsistencias de Integridad Referencial ---');
  
  const branches = await prisma.branch.findMany({ select: { id: true } });
  const branchIds = new Set(branches.map(b => b.id));

  const variants = await prisma.productVariant.findMany({ select: { id: true } });
  const variantIds = new Set(variants.map(v => v.id));

  const warehouses = await prisma.warehouse.findMany({ select: { id: true } });
  const warehouseIds = new Set(warehouses.map(w => w.id));
  
  // 1. StockLevel
  const stockLevels = await prisma.stockLevel.findMany();
  for (const s of stockLevels) {
    if (s.branchId && !branchIds.has(s.branchId)) {
      console.log(`Fixing StockLevel ${s.id}: Invalid branchId ${s.branchId}`);
      await prisma.stockLevel.update({ where: { id: s.id }, data: { branchId: null } });
    }
    if (!variantIds.has(s.variantId)) {
      console.log(`CRITICAL: StockLevel ${s.id} has invalid variantId ${s.variantId}. Deleting.`);
      await prisma.stockLevel.delete({ where: { id: s.id } });
    }
  }

  // 2. InventoryMovement
  const movements = await prisma.inventoryMovement.findMany();
  for (const m of movements) {
    if (!variantIds.has(m.variantId)) {
      console.log(`CRITICAL: Movement ${m.id} has invalid variantId ${m.variantId}. Deleting.`);
      await prisma.inventoryMovement.delete({ where: { id: m.id } });
    }
    if (m.sourceWarehouseId && !warehouseIds.has(m.sourceWarehouseId)) {
      console.log(`Fixing Movement ${m.id}: Invalid sourceWarehouseId ${m.sourceWarehouseId}`);
      await prisma.inventoryMovement.update({ where: { id: m.id }, data: { sourceWarehouseId: null } });
    }
    if (m.destinationWarehouseId && !warehouseIds.has(m.destinationWarehouseId)) {
      console.log(`Fixing Movement ${m.id}: Invalid destinationWarehouseId ${m.destinationWarehouseId}`);
      await prisma.inventoryMovement.update({ where: { id: m.id }, data: { destinationWarehouseId: null } });
    }
  }
  
  console.log('--- Limpieza completada ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
