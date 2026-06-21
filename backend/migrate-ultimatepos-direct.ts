/**
 * MIGRACIÓN ULTIMATEPOS → VESTIX ERP
 * ====================================
 * Usa Prisma Client directamente (sin NestJS, sin Redis).
 * 
 * EJECUTAR CON:
 *   npx ts-node migrate-ultimatepos-direct.ts
 */

import { PrismaClient } from '@prisma/client';
import * as mysql2 from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// ========================
// CONFIGURACIÓN
// ========================
const MYSQL_CONFIG = {
  host: '127.0.0.1',
  user: 'ultimatepos',
  password: 'ultimatepos',
  database: 'ultimatepos',
};

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://erp_admin:84gi5ZKWfpHSFmZ@127.0.0.1:5433/erp_prod',
});

// ========================
// HELPERS
// ========================
function safeFloat(val: any): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function safeName(val: any, fallback = 'Sin nombre'): string {
  if (!val || val === 'NULL') return fallback;
  const s = String(val).trim();
  return s === '' ? fallback : s;
}

function mapProductType(type: string): 'SINGLE' | 'VARIABLE' | 'COMBO' {
  if (type === 'variable') return 'VARIABLE';
  if (type === 'combo') return 'COMBO';
  return 'SINGLE';
}

// ========================
// BOOTSTRAP
// ========================
async function bootstrap() {
  console.log('\n🚀 Iniciando migración UltimatePOS → Vestix ERP (modo directo)...\n');

  const db = await mysql2.createConnection(MYSQL_CONFIG);
  console.log('✅ Conectado a MySQL (ultimatepos)');
  await prisma.$connect();
  console.log('✅ Conectado a PostgreSQL (ERP)\n');

  // Mapas de IDs: mysqlId → erpId (uuid)
  const categoryMap: Record<number, string> = {};
  const brandMap: Record<number, string> = {};
  const supplierMap: Record<number, string> = {};
  const customerMap: Record<number, string> = {};
  const variantMap: Record<number, string> = {};

  // ========================
  // 0. BRANCH + WAREHOUSE
  // ========================
  console.log('🏪 PASO 0: Verificando Branch y Warehouse...');
  const [bizRows] = await db.query<any[]>(
    `SELECT id, name FROM business LIMIT 1`
  );
  const [locRows] = await db.query<any[]>(
    `SELECT id, name, city FROM business_locations ORDER BY id ASC LIMIT 1`
  );

  const bizName = bizRows[0]?.name ? safeName(bizRows[0].name) : 'Casa Central';
  const locName = locRows[0]?.name ? safeName(locRows[0].name) : 'Sucursal Principal';

  let branch = await prisma.branch.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: bizName,
        code: 'MAIN',
        isMain: true,
        isActive: true,
      }
    });
    console.log(`   ✅ Branch creado: "${branch.name}"`);
  } else {
    console.log(`   ℹ️  Branch existente: "${branch.name}"`);
  }

  let warehouse = await prisma.warehouse.findFirst({ where: { branchId: branch.id } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: locName,
        code: 'WH-MAIN',
        type: 'STORAGE',
        isActive: true,
        branchId: branch.id,
      }
    });
    console.log(`   ✅ Warehouse creado: "${warehouse.name}"\n`);
  } else {
    console.log(`   ℹ️  Warehouse existente: "${warehouse.name}"\n`);
  }

  const BRANCH_ID = branch.id;
  const WAREHOUSE_ID = warehouse.id;

  // ========================
  // 1. CATEGORÍAS
  // ========================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 PASO 1: Migrando Categorías...');

  const [catRows] = await db.query<any[]>(
    `SELECT id, name, parent_id FROM categories
     WHERE (category_type = 'product' OR category_type IS NULL) AND deleted_at IS NULL
     ORDER BY parent_id ASC, id ASC`
  );

  let catCreated = 0;
  const rootCats = catRows.filter((c: any) => !c.parent_id || c.parent_id === 0);
  const childCats = catRows.filter((c: any) => c.parent_id && c.parent_id !== 0);

  for (const c of [...rootCats, ...childCats]) {
    const name = safeName(c.name);
    let existing = await prisma.category.findFirst({ where: { name } });
    if (!existing) {
      const parentId = (c.parent_id && c.parent_id !== 0) ? (categoryMap[c.parent_id] ?? null) : null;
      existing = await prisma.category.create({ data: { name, parentId } });
      catCreated++;
    }
    categoryMap[c.id] = existing.id;
  }

  // Categoría por defecto
  let defaultCat = await prisma.category.findFirst({ where: { name: 'General' } });
  if (!defaultCat) defaultCat = await prisma.category.create({ data: { name: 'General' } });
  const DEFAULT_CATEGORY_ID = defaultCat.id;

  console.log(`   ✅ ${catCreated} categorías creadas (${catRows.length} procesadas)\n`);

  // ========================
  // 2. MARCAS
  // ========================
  console.log('🏷️  PASO 2: Migrando Marcas...');
  const [brandRows] = await db.query<any[]>(
    `SELECT id, name FROM brands WHERE deleted_at IS NULL ORDER BY id ASC`
  );

  let brandCreated = 0;
  for (const b of brandRows) {
    const name = safeName(b.name);
    let existing = await prisma.brand.findFirst({ where: { name } });
    if (!existing) {
      existing = await prisma.brand.create({ data: { name } });
      brandCreated++;
    }
    brandMap[b.id] = existing.id;
  }
  console.log(`   ✅ ${brandCreated} marcas creadas\n`);

  // ========================
  // 3. PROVEEDORES
  // ========================
  console.log('🏭 PASO 3: Migrando Proveedores...');
  const [supplierRows] = await db.query<any[]>(
    `SELECT id, supplier_business_name, name, email, mobile, tax_number, balance
     FROM contacts
     WHERE type = 'supplier' AND deleted_at IS NULL
     ORDER BY id ASC`
  );

  let suppCreated = 0;
  for (const s of supplierRows) {
    const rawName = s.supplier_business_name || s.name || '';
    const companyName = safeName(rawName, `Proveedor-${s.id}`);
    
    // Intentar buscar por nombre exacto
    let existing = await prisma.supplier.findFirst({ where: { companyName } });
    if (!existing && s.tax_number) {
      existing = await prisma.supplier.findFirst({ where: { taxId: s.tax_number } });
    }
    
    if (!existing) {
      existing = await prisma.supplier.create({
        data: {
          companyName,
          taxId: s.tax_number || null,
          email: s.email || null,
          phone: s.mobile || null,
          balance: safeFloat(s.balance),
          currency: 'ARS',
        }
      });
      suppCreated++;
    }
    supplierMap[s.id] = existing.id;
  }
  console.log(`   ✅ ${suppCreated} proveedores creados\n`);

  // ========================
  // 4. CLIENTES
  // ========================
  console.log('👥 PASO 4: Migrando Clientes...');
  const [customerRows] = await db.query<any[]>(
    `SELECT id, name, first_name, last_name, contact_type, email, mobile,
            tax_number, credit_limit, balance, contact_status
     FROM contacts
     WHERE type = 'customer' AND deleted_at IS NULL AND is_default = 0
     ORDER BY id ASC`
  );

  let custCreated = 0;
  for (const c of customerRows) {
    const parts = [c.first_name, c.last_name].filter(Boolean);
    const fullName = safeName(c.name || parts.join(' '), `Cliente-${c.id}`);
    const type = c.contact_type === 'business' ? 'BUSINESS' : 'INDIVIDUAL';

    // Buscar existente por taxId o nombre
    let existing: any = null;
    if (c.tax_number) {
      existing = await prisma.customer.findFirst({ where: { taxId: c.tax_number } });
    }
    if (!existing) {
      existing = await prisma.customer.findFirst({ where: { fullName } });
    }

    if (!existing) {
      existing = await prisma.customer.create({
        data: {
          type,
          fullName,
          taxId: c.tax_number || null,
          email: c.email || null,
          phone: c.mobile || null,
          creditLimit: safeFloat(c.credit_limit),
          usedCredit: 0,
          isActive: c.contact_status === 'active',
        }
      });
      custCreated++;
    }
    customerMap[c.id] = existing.id;
  }
  console.log(`   ✅ ${custCreated} clientes creados\n`);

  // ========================
  // 5. PRODUCTOS Y VARIANTES
  // ========================
  console.log('📦 PASO 5: Migrando Productos y Variantes...');

  const [allProducts] = await db.query<any[]>(
    `SELECT p.id, p.name, p.type, p.sku, p.brand_id, p.category_id, p.product_description
     FROM products p
     WHERE p.is_inactive = 0
     ORDER BY p.id ASC`
  );

  const [allVariations] = await db.query<any[]>(
    `SELECT v.id, v.name, v.product_id, v.sub_sku, v.default_purchase_price,
            v.sell_price_inc_tax, v.default_sell_price
     FROM variations v
     WHERE v.deleted_at IS NULL
     ORDER BY v.product_id ASC, v.id ASC`
  );

  const [allBarcodes] = await db.query<any[]>(`SELECT * FROM barcodes ORDER BY id ASC`);

  // Agrupar
  const variationsByProduct: Record<number, any[]> = {};
  for (const v of allVariations) {
    if (!variationsByProduct[v.product_id]) variationsByProduct[v.product_id] = [];
    variationsByProduct[v.product_id].push(v);
  }

  const barcodesByVariation: Record<number, string[]> = {};
  for (const b of allBarcodes) {
    if (!barcodesByVariation[b.variation_id]) barcodesByVariation[b.variation_id] = [];
    barcodesByVariation[b.variation_id].push(b.name);
  }

  let prodCreated = 0;
  let varCreated = 0;
  let varSkipped = 0;

  for (const p of allProducts) {
    const variations = variationsByProduct[p.id] || [];
    if (variations.length === 0) continue;

    const categoryId = categoryMap[p.category_id] ?? DEFAULT_CATEGORY_ID;
    const brandId = p.brand_id ? (brandMap[p.brand_id] ?? null) : null;
    const productType = mapProductType(p.type);
    let baseSku = (p.sku && p.sku !== 'NULL' && p.sku !== '') ? p.sku : `UP-${p.id}`;

    // Buscar o crear producto
    let product = await prisma.product.findUnique({ where: { baseSku } });
    if (!product) {
      // Intentar por nombre por si ya fue migrado con distinto SKU
      product = await prisma.product.findFirst({ where: { name: safeName(p.name) } });
    }
    if (!product) {
      try {
        product = await prisma.product.create({
          data: {
            name: safeName(p.name),
            baseSku,
            description: p.product_description || null,
            categoryId,
            brandId,
            type: productType,
            isVariable: productType === 'VARIABLE',
            isActive: true,
            isPublished: false,
            costPrice: safeFloat(variations[0]?.default_purchase_price),
          }
        });
        prodCreated++;
      } catch {
        baseSku = `UP-${p.id}`;
        try {
          product = await prisma.product.create({
            data: {
              name: safeName(p.name),
              baseSku,
              description: p.product_description || null,
              categoryId,
              brandId,
              type: productType,
              isVariable: productType === 'VARIABLE',
              isActive: true,
              isPublished: false,
              costPrice: safeFloat(variations[0]?.default_purchase_price),
            }
          });
          prodCreated++;
        } catch (e2: any) {
          console.warn(`   ⚠️  No se pudo crear producto "${p.name}": ${e2.message}`);
          continue;
        }
      }
    }

    // Variantes
    for (const v of variations) {
      const isDummy = !v.name || v.name === 'DUMMY';
      const sizeName = isDummy ? null : v.name;
      const costPrice = safeFloat(v.default_purchase_price);
      const basePrice = safeFloat(v.sell_price_inc_tax) || safeFloat(v.default_sell_price);
      let varSku = (v.sub_sku && v.sub_sku !== 'NULL' && v.sub_sku !== '') ? v.sub_sku : baseSku;

      let variant = await prisma.productVariant.findUnique({ where: { sku: varSku } });
      if (!variant) {
        try {
          variant = await prisma.productVariant.create({
            data: { productId: product.id, sku: varSku, size: sizeName, costPrice, basePrice, isActive: true }
          });
          varCreated++;
        } catch {
          varSku = `${varSku}-${v.id}`;
          try {
            variant = await prisma.productVariant.create({
              data: { productId: product.id, sku: varSku, size: sizeName, costPrice, basePrice, isActive: true }
            });
            varCreated++;
          } catch {
            varSkipped++;
            continue;
          }
        }
      }
      variantMap[v.id] = variant.id;

      // Barcodes adicionales
      for (const bc of (barcodesByVariation[v.id] || [])) {
        if (!bc || bc === varSku) continue;
        const existingBc = await prisma.productBarcode.findFirst({ where: { barcode: bc } });
        if (!existingBc) {
          try {
            await prisma.productBarcode.create({ data: { variantId: variant.id, barcode: bc, type: 'MANUFACTURER' } });
          } catch { /* duplicado, ignorar */ }
        }
      }
    }
    
    if (prodCreated % 25 === 0 && prodCreated > 0) {
      process.stdout.write(`   ... ${prodCreated} productos procesados\n`);
    }
  }
  console.log(`   ✅ ${prodCreated} productos creados, ${varCreated} variantes, ${varSkipped} omitidas\n`);

  // ========================
  // 6. STOCK LEVELS
  // ========================
  console.log('📊 PASO 6: Migrando Stock...');
  const [stockRows] = await db.query<any[]>(
    `SELECT vld.variation_id, SUM(vld.qty_available) as total_qty
     FROM variation_location_details vld
     INNER JOIN variations v ON vld.variation_id = v.id AND v.deleted_at IS NULL
     WHERE vld.qty_available > 0
     GROUP BY vld.variation_id`
  );

  let stockCreated = 0;
  let stockUpdated = 0;
  let stockSkipped = 0;

  for (const row of stockRows) {
    const variantId = variantMap[row.variation_id];
    if (!variantId) { stockSkipped++; continue; }
    const qty = Math.max(0, Math.round(safeFloat(row.total_qty)));
    if (qty === 0) continue;

    try {
      const existing = await prisma.stockLevel.findUnique({
        where: { variantId_warehouseId_batchId: { variantId, warehouseId: WAREHOUSE_ID, batchId: null } }
      });

      if (existing) {
        await prisma.stockLevel.update({
          where: { id: existing.id },
          data: { physicalQuantity: qty, availableQuantity: qty }
        });
        stockUpdated++;
      } else {
        await prisma.stockLevel.create({
          data: { variantId, warehouseId: WAREHOUSE_ID, branchId: BRANCH_ID, physicalQuantity: qty, reservedQuantity: 0, availableQuantity: qty }
        });
        stockCreated++;
      }
    } catch (e: any) {
      stockSkipped++;
    }
  }
  console.log(`   ✅ ${stockCreated} stock levels creados, ${stockUpdated} actualizados, ${stockSkipped} omitidos\n`);

  // ========================
  // 7. COMPRAS
  // ========================
  console.log('🛒 PASO 7: Migrando Órdenes de Compra...');
  const [purchaseTxns] = await db.query<any[]>(
    `SELECT t.id, t.contact_id, t.transaction_date, t.final_total, t.status, t.ref_no
     FROM transactions t
     WHERE t.type = 'purchase' AND t.is_suspend = 0
     ORDER BY t.transaction_date ASC`
  );

  const [allPurchasePayments] = await db.query<any[]>(
    `SELECT tp.transaction_id, tp.amount FROM transaction_payments tp
     INNER JOIN transactions t ON tp.transaction_id = t.id WHERE t.type = 'purchase'`
  );

  const paysByPO: Record<number, number> = {};
  for (const pp of allPurchasePayments) {
    paysByPO[pp.transaction_id] = (paysByPO[pp.transaction_id] || 0) + safeFloat(pp.amount);
  }

  let poCreated = 0;
  let poLineCreated = 0;

  for (const tx of purchaseTxns) {
    const supplierId = tx.contact_id ? (supplierMap[tx.contact_id] ?? null) : null;
    if (!supplierId) continue;

    const [lines] = await db.query<any[]>(
      `SELECT pl.variation_id, pl.quantity, pl.purchase_price_inc_tax, pl.purchase_price
       FROM purchase_lines pl WHERE pl.transaction_id = ?`,
      [tx.id]
    );
    if (lines.length === 0) continue;

    const validLines = lines.filter((l: any) => !!variantMap[l.variation_id]);
    if (validLines.length === 0) continue;

    const totalAmount = safeFloat(tx.final_total);
    const paidAmount = paysByPO[tx.id] || 0;
    const status = tx.status === 'draft' ? 'DRAFT' : tx.status === 'ordered' ? 'ISSUED' : 'COMPLETED';

    try {
      const po = await prisma.purchaseOrder.create({
        data: {
          supplierId,
          destinationWarehouseId: WAREHOUSE_ID,
          status,
          totalAmount,
          paidAmount,
          currency: 'ARS',
          notes: tx.ref_no ? `Ref: ${tx.ref_no}` : null,
          issuedAt: tx.transaction_date ? new Date(tx.transaction_date) : null,
          completedAt: status === 'COMPLETED' ? new Date(tx.transaction_date) : null,
        }
      });
      poCreated++;

      for (const line of validLines) {
        const variantId = variantMap[line.variation_id];
        const qty = Math.max(1, Math.round(safeFloat(line.quantity)));
        const unitCost = safeFloat(line.purchase_price_inc_tax) || safeFloat(line.purchase_price);

        const poLine = await prisma.pOLineItem.create({
          data: {
            purchaseOrderId: po.id,
            variantId,
            orderedQuantity: qty,
            receivedQuantity: qty,
            unitCost,
            totalAmount: qty * unitCost,
          }
        });
        poLineCreated++;

        if (status === 'COMPLETED') {
          const receipt = await prisma.goodsReceipt.create({
            data: {
              purchaseOrderId: po.id,
              destinationWarehouseId: WAREHOUSE_ID,
              status: 'VALIDATED',
              notes: 'Migrado desde UltimatePOS',
            }
          });
          await prisma.goodsReceiptLine.create({
            data: {
              receiptId: receipt.id,
              poLineItemId: poLine.id,
              variantId,
              expectedQuantity: qty,
              receivedQuantity: qty,
              difference: 0,
            }
          });
        }
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Error compra ID=${tx.id}: ${e.message}`);
    }
  }
  console.log(`   ✅ ${poCreated} órdenes de compra, ${poLineCreated} líneas\n`);

  // ========================
  // 8. VENTAS
  // ========================
  console.log('💰 PASO 8: Migrando Ventas...');
  const [sellTxns] = await db.query<any[]>(
    `SELECT t.id, t.contact_id, t.transaction_date, t.final_total,
            t.total_before_tax, t.discount_amount, t.status
     FROM transactions t
     WHERE t.type = 'sell' AND t.is_suspend = 0 AND t.is_quotation = 0
     ORDER BY t.transaction_date ASC`
  );

  const [allSellPayments] = await db.query<any[]>(
    `SELECT tp.transaction_id, tp.amount, tp.method FROM transaction_payments tp
     INNER JOIN transactions t ON tp.transaction_id = t.id WHERE t.type = 'sell'`
  );

  const paysBySell: Record<number, any[]> = {};
  for (const sp of allSellPayments) {
    if (!paysBySell[sp.transaction_id]) paysBySell[sp.transaction_id] = [];
    paysBySell[sp.transaction_id].push(sp);
  }

  let saleCreated = 0;
  let saleLineCreated = 0;
  let saleSkipped = 0;

  for (const tx of sellTxns) {
    const [sellLines] = await db.query<any[]>(
      `SELECT tsl.variation_id, tsl.quantity, tsl.unit_price_inc_tax,
              tsl.unit_price_before_discount, tsl.line_discount_amount,
              p.category_id as mysql_cat_id
       FROM transaction_sell_lines tsl
       INNER JOIN variations v ON tsl.variation_id = v.id
       INNER JOIN products p ON v.product_id = p.id
       WHERE tsl.transaction_id = ? AND tsl.parent_sell_line_id IS NULL`,
      [tx.id]
    );

    const validLines = sellLines.filter((l: any) => !!variantMap[l.variation_id]);
    if (validLines.length === 0) { saleSkipped++; continue; }

    const customerId = tx.contact_id ? (customerMap[tx.contact_id] ?? null) : null;
    const pays = paysBySell[tx.id] || [];
    const mainPay = pays[0];

    let paymentMethod = 'EFECTIVO';
    if (mainPay?.method) {
      const m = (mainPay.method as string).toLowerCase();
      if (m.includes('bank_transfer') || m.includes('transfer')) paymentMethod = 'TRANSFERENCIA';
      else if (m.includes('card') || m.includes('credit') || m.includes('debit')) paymentMethod = 'TARJETA';
      else if (m.includes('cash')) paymentMethod = 'EFECTIVO';
      else paymentMethod = m.toUpperCase();
    }

    try {
      const order = await prisma.saleOrder.create({
        data: {
          id: uuidv4(),
          branchId: BRANCH_ID,
          warehouseId: WAREHOUSE_ID,
          source: 'POS_LEGACY',
          customerId,
          subtotal: safeFloat(tx.total_before_tax),
          cartDiscountTotal: safeFloat(tx.discount_amount),
          grandTotal: safeFloat(tx.final_total),
          paymentMethod,
          status: 'COMPLETED',
          issueInvoice: false,
          createdAt: tx.transaction_date ? new Date(tx.transaction_date) : new Date(),
        }
      });
      saleCreated++;

      for (const line of validLines) {
        const variantId = variantMap[line.variation_id];
        const categoryId = categoryMap[line.mysql_cat_id] ?? DEFAULT_CATEGORY_ID;
        const qty = Math.max(1, Math.round(safeFloat(line.quantity)));
        const basePrice = safeFloat(line.unit_price_before_discount) || safeFloat(line.unit_price_inc_tax);

        await prisma.orderLineItem.create({
          data: {
            orderId: order.id,
            variantId,
            categoryId,
            quantity: qty,
            basePrice,
            discountAmount: safeFloat(line.line_discount_amount),
            finalPrice: safeFloat(line.unit_price_inc_tax),
          }
        });
        saleLineCreated++;
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Error venta ID=${tx.id}: ${e.message}`);
      saleSkipped++;
    }
  }
  console.log(`   ✅ ${saleCreated} ventas creadas, ${saleLineCreated} líneas, ${saleSkipped} omitidas\n`);

  // ========================
  // RESUMEN
  // ========================
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
  console.log('═══════════════════════════════════════════════');
  console.log(`   📂 Categorías:        ${Object.keys(categoryMap).length}`);
  console.log(`   🏷️  Marcas:            ${Object.keys(brandMap).length}`);
  console.log(`   🏭 Proveedores:       ${Object.keys(supplierMap).length}`);
  console.log(`   👥 Clientes:          ${Object.keys(customerMap).length}`);
  console.log(`   📦 Productos:         ${prodCreated}`);
  console.log(`   🔹 Variantes:         ${varCreated}`);
  console.log(`   📊 Stock levels:      ${stockCreated} creados, ${stockUpdated} actualizados`);
  console.log(`   🛒 Compras:           ${poCreated} órdenes, ${poLineCreated} líneas`);
  console.log(`   💰 Ventas:            ${saleCreated} órdenes, ${saleLineCreated} líneas`);
  console.log('═══════════════════════════════════════════════\n');

  await db.end();
  await prisma.$disconnect();
}

bootstrap().catch((err) => {
  console.error('\n❌ Error fatal:', err.message || err);
  process.exit(1);
});
