/**
 * MIGRACIÓN ULTIMATEPOS → VESTIX ERP
 * ====================================
 * Lee directamente desde MySQL (ultimatepos) y escribe en PostgreSQL (Prisma)
 * 
 * Datos migrados:
 *   1. Categorías
 *   2. Marcas (no eliminadas)
 *   3. Proveedores (contacts tipo supplier)
 *   4. Clientes (contacts tipo customer, excluye Walk-In)
 *   5. Productos + Variantes (single y variable, con SKUs, precios y stock)
 *   6. Stock levels (via variation_location_details)
 *   7. Órdenes de compra (purchases) + líneas
 *   8. Ventas (sell transactions) + líneas
 * 
 * EJECUTAR CON:
 *   npx ts-node migrate-ultimatepos.ts
 *   (o: node -r ts-node/register migrate-ultimatepos.ts)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/core/prisma/prisma.service';
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

// IDs de referencia del ERP (deben existir antes de migrar)
// Ajustá estos valores si ya tenés branch/warehouse creados
let BRANCH_ID: string;
let WAREHOUSE_ID: string;
let DEFAULT_CATEGORY_ID: string;

// ========================
// HELPERS
// ========================
function safeFloat(val: any): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function safeInt(val: any): number {
  const n = parseInt(val);
  return isNaN(n) ? 0 : n;
}

function safeName(val: any): string {
  if (!val || val === 'NULL' || val === '') return 'Sin nombre';
  return String(val).trim();
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
  console.log('\n🚀 Iniciando migración UltimatePOS → Vestix ERP...\n');

  // Conectar al ERP (NestJS + Prisma)
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);

  // Conectar a MySQL
  const db = await mysql2.createConnection(MYSQL_CONFIG);
  console.log('✅ Conectado a MySQL (ultimatepos)');
  console.log('✅ Conectado a PostgreSQL (ERP)\n');

  // ========================
  // 0. OBTENER IDS DE REFERENCIA
  // ========================
  console.log('📋 Buscando Branch y Warehouse de referencia...');
  
  const branch = await prisma.branch.findFirst({ where: { isActive: true } });
  if (!branch) throw new Error('No hay ningún Branch en el ERP. Creá uno primero desde la UI.');
  BRANCH_ID = branch.id;
  console.log(`   Branch: "${branch.name}" (${branch.id})`);

  const warehouse = await prisma.warehouse.findFirst({ where: { branchId: BRANCH_ID, isActive: true } });
  if (!warehouse) throw new Error('No hay ningún Warehouse para ese Branch.');
  WAREHOUSE_ID = warehouse.id;
  console.log(`   Warehouse: "${warehouse.name}" (${warehouse.id})\n`);

  // Mapas de IDs: mysqlId → erpId (uuid)
  const categoryMap: Record<number, string> = {};
  const brandMap: Record<number, string> = {};
  const supplierMap: Record<number, string> = {};
  const customerMap: Record<number, string> = {};
  const variantMap: Record<number, string> = {};  // variations.id → ProductVariant.id

  // ========================
  // 1. CATEGORÍAS
  // ========================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 PASO 1: Migrando Categorías...');
  
  const [catRows] = await db.query<any[]>(
    `SELECT id, name, parent_id FROM categories 
     WHERE category_type = 'product' AND deleted_at IS NULL 
     ORDER BY parent_id ASC, id ASC`
  );

  let catCreated = 0;
  let catExists = 0;

  // Primero las raíz (parent_id = 0 o NULL), luego las hijas
  const rootCats = catRows.filter((c: any) => !c.parent_id || c.parent_id === 0);
  const childCats = catRows.filter((c: any) => c.parent_id && c.parent_id !== 0);

  for (const c of [...rootCats, ...childCats]) {
    const name = safeName(c.name);
    let existing = await prisma.category.findFirst({ where: { name } });
    if (!existing) {
      const parentId = c.parent_id && c.parent_id !== 0 ? categoryMap[c.parent_id] ?? null : null;
      existing = await prisma.category.create({ data: { name, parentId } });
      catCreated++;
    } else {
      catExists++;
    }
    categoryMap[c.id] = existing.id;
  }
  
  // Categoría por defecto para productos sin categoría
  let defaultCat = await prisma.category.findFirst({ where: { name: 'General' } });
  if (!defaultCat) defaultCat = await prisma.category.create({ data: { name: 'General' } });
  DEFAULT_CATEGORY_ID = defaultCat.id;
  
  console.log(`   ✅ ${catCreated} creadas, ${catExists} ya existían\n`);

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
  console.log(`   ✅ ${brandCreated} marcas creadas, ${brandRows.length - brandCreated} ya existían\n`);

  // ========================
  // 3. PROVEEDORES (supplier contacts)
  // ========================
  console.log('🏭 PASO 3: Migrando Proveedores...');
  const [supplierRows] = await db.query<any[]>(
    `SELECT id, supplier_business_name, name, email, mobile, tax_number, balance, credit_limit, address_line_1
     FROM contacts 
     WHERE type = 'supplier' AND deleted_at IS NULL 
     ORDER BY id ASC`
  );

  let suppCreated = 0;
  for (const s of supplierRows) {
    const companyName = safeName(s.supplier_business_name || s.name);
    let existing = await prisma.supplier.findFirst({ where: { companyName } });
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
  // 4. CLIENTES (customer contacts, excluye Walk-In)
  // ========================
  console.log('👥 PASO 4: Migrando Clientes...');
  const [customerRows] = await db.query<any[]>(
    `SELECT id, name, first_name, last_name, contact_type, email, mobile, tax_number, 
            credit_limit, balance, contact_status, address_line_1
     FROM contacts 
     WHERE type = 'customer' AND deleted_at IS NULL AND is_default = 0
     ORDER BY id ASC`
  );

  let custCreated = 0;
  for (const c of customerRows) {
    const fullName = safeName(c.name || [c.first_name, c.last_name].filter(Boolean).join(' '));
    const type = c.contact_type === 'business' ? 'BUSINESS' : 'INDIVIDUAL';
    
    let existing: any = null;
    if (c.tax_number) {
      existing = await prisma.customer.findFirst({ where: { taxId: c.tax_number } });
    }
    if (!existing && c.email) {
      // No hay unique en email, buscar por nombre+email
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
  
  // Cargar todos los datos de MySQL de una vez para eficiencia
  const [allProducts] = await db.query<any[]>(
    `SELECT p.id, p.name, p.type, p.sku, p.brand_id, p.category_id, 
            p.product_description, p.is_inactive
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

  const [allBarcodes] = await db.query<any[]>(
    `SELECT * FROM barcodes ORDER BY id ASC`
  );

  // Agrupar variaciones por producto
  const variationsByProduct: Record<number, any[]> = {};
  for (const v of allVariations) {
    if (!variationsByProduct[v.product_id]) variationsByProduct[v.product_id] = [];
    variationsByProduct[v.product_id].push(v);
  }

  // Agrupar barcodes por variation_id
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
    
    let baseSku = p.sku && p.sku !== 'NULL' && p.sku !== '' ? p.sku : `UP-${p.id}`;

    // Buscar o crear producto
    let product = await prisma.product.findUnique({ where: { baseSku } });
    if (!product) {
      // Si el baseSku ya existe por colisión, hacerlo único
      const existing = await prisma.product.findFirst({ where: { name: p.name } });
      if (existing) {
        product = existing;
      } else {
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
        } catch (e: any) {
          // baseSku duplicado: generar uno alternativo
          baseSku = `UP-${p.id}-${Date.now()}`;
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
        }
      }
    }

    // Crear variantes
    for (const v of variations) {
      // Determinar SKU de variante
      let varSku = v.sub_sku && v.sub_sku !== 'NULL' && v.sub_sku !== '' 
        ? v.sub_sku 
        : baseSku;

      // Nombre/talle de variante: si es DUMMY o el único, no es un atributo real
      const isDummy = v.name === 'DUMMY' || v.name === null;
      const sizeName = isDummy ? null : v.name;
      const costPrice = safeFloat(v.default_purchase_price);
      const basePrice = safeFloat(v.sell_price_inc_tax) || safeFloat(v.default_sell_price);

      // Buscar si ya existe
      let variant = await prisma.productVariant.findUnique({ where: { sku: varSku } });
      if (!variant) {
        try {
          variant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: varSku,
              size: sizeName,
              costPrice,
              basePrice,
              isActive: true,
            }
          });
          varCreated++;
        } catch (e: any) {
          // SKU duplicado
          varSku = `${varSku}-${v.id}`;
          try {
            variant = await prisma.productVariant.create({
              data: {
                productId: product.id,
                sku: varSku,
                size: sizeName,
                costPrice,
                basePrice,
                isActive: true,
              }
            });
            varCreated++;
          } catch {
            varSkipped++;
            continue;
          }
        }
      }
      
      // Guardar el mapeo variations.id → variant.id
      variantMap[v.id] = variant.id;

      // Crear barcodes adicionales si existen
      const extra = barcodesByVariation[v.id] || [];
      for (const bc of extra) {
        if (!bc || bc === varSku) continue;
        try {
          await prisma.productBarcode.create({
            data: {
              variantId: variant.id,
              barcode: bc,
              type: 'MANUFACTURER',
            }
          });
        } catch { /* barcode duplicado, ignorar */ }
      }
    }
  }
  console.log(`   ✅ ${prodCreated} productos creados, ${varCreated} variantes creadas, ${varSkipped} omitidas\n`);

  // ========================
  // 6. STOCK LEVELS
  // ========================
  console.log('📊 PASO 6: Migrando Stock (variation_location_details)...');
  const [stockRows] = await db.query<any[]>(
    `SELECT vld.variation_id, vld.qty_available
     FROM variation_location_details vld
     INNER JOIN variations v ON vld.variation_id = v.id AND v.deleted_at IS NULL
     WHERE vld.qty_available > 0
     ORDER BY vld.variation_id ASC`
  );

  let stockCreated = 0;
  let stockUpdated = 0;
  let stockSkipped = 0;

  for (const row of stockRows) {
    const variantId = variantMap[row.variation_id];
    if (!variantId) { stockSkipped++; continue; }

    const qty = Math.round(safeFloat(row.qty_available));
    
    try {
      const existing = await prisma.stockLevel.findUnique({
        where: { variantId_warehouseId_batchId: { variantId, warehouseId: WAREHOUSE_ID, batchId: null } }
      });

      if (existing) {
        await prisma.stockLevel.update({
          where: { id: existing.id },
          data: {
            physicalQuantity: existing.physicalQuantity + qty,
            availableQuantity: existing.availableQuantity + qty,
          }
        });
        stockUpdated++;
      } else {
        await prisma.stockLevel.create({
          data: {
            variantId,
            warehouseId: WAREHOUSE_ID,
            branchId: BRANCH_ID,
            physicalQuantity: qty,
            reservedQuantity: 0,
            availableQuantity: qty,
          }
        });
        stockCreated++;
      }
    } catch (e: any) {
      stockSkipped++;
    }
  }
  console.log(`   ✅ ${stockCreated} stock levels creados, ${stockUpdated} actualizados, ${stockSkipped} omitidos\n`);

  // ========================
  // 7. COMPRAS (purchases)
  // ========================
  console.log('🛒 PASO 7: Migrando Órdenes de Compra...');
  const [purchaseTxns] = await db.query<any[]>(
    `SELECT t.id, t.contact_id, t.transaction_date, t.final_total, t.discount_amount,
            t.status, t.invoice_no, t.ref_no
     FROM transactions t
     WHERE t.type = 'purchase' AND t.is_suspend = 0
     ORDER BY t.transaction_date ASC`
  );

  const [purchasePayments] = await db.query<any[]>(
    `SELECT tp.transaction_id, tp.amount, tp.method
     FROM transaction_payments tp
     INNER JOIN transactions t ON tp.transaction_id = t.id
     WHERE t.type = 'purchase'`
  );

  const paymentsByPurchaseTxn: Record<number, any[]> = {};
  for (const pp of purchasePayments) {
    if (!paymentsByPurchaseTxn[pp.transaction_id]) paymentsByPurchaseTxn[pp.transaction_id] = [];
    paymentsByPurchaseTxn[pp.transaction_id].push(pp);
  }

  let poCreated = 0;
  let poLineCreated = 0;

  for (const tx of purchaseTxns) {
    const supplierId = tx.contact_id ? (supplierMap[tx.contact_id] ?? null) : null;
    
    // Si no hay proveedor mapeado, saltear
    if (!supplierId) continue;

    const [purchaseLines] = await db.query<any[]>(
      `SELECT pl.variation_id, pl.quantity, pl.purchase_price, pl.purchase_price_inc_tax
       FROM purchase_lines pl WHERE pl.transaction_id = ?`,
      [tx.id]
    );

    if (purchaseLines.length === 0) continue;

    const totalAmount = safeFloat(tx.final_total);
    const payments = paymentsByPurchaseTxn[tx.id] || [];
    const paidAmount = payments.reduce((sum: number, p: any) => sum + safeFloat(p.amount), 0);

    // Determinar status de PO
    let poStatus = 'COMPLETED';
    if (tx.status === 'draft') poStatus = 'DRAFT';
    else if (tx.status === 'ordered') poStatus = 'ISSUED';

    try {
      const po = await prisma.purchaseOrder.create({
        data: {
          supplierId,
          destinationWarehouseId: WAREHOUSE_ID,
          status: poStatus,
          totalAmount,
          paidAmount,
          currency: 'ARS',
          notes: tx.ref_no ? `Ref: ${tx.ref_no}` : null,
          issuedAt: tx.transaction_date ? new Date(tx.transaction_date) : null,
          completedAt: poStatus === 'COMPLETED' ? new Date(tx.transaction_date) : null,
        }
      });
      poCreated++;

      for (const line of purchaseLines) {
        const variantId = variantMap[line.variation_id];
        if (!variantId) continue;

        const qty = Math.round(safeFloat(line.quantity));
        const unitCost = safeFloat(line.purchase_price_inc_tax) || safeFloat(line.purchase_price);

        const poLine = await prisma.pOLineItem.create({
          data: {
            purchaseOrderId: po.id,
            variantId,
            orderedQuantity: qty,
            receivedQuantity: qty, // En purchases ya recibidas
            unitCost,
            totalAmount: qty * unitCost,
          }
        });
        poLineCreated++;

        // Crear el GoodsReceipt para marcar como recibido
        if (poStatus === 'COMPLETED') {
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
      console.warn(`   ⚠️  Error en compra ID=${tx.id}: ${e.message}`);
    }
  }
  console.log(`   ✅ ${poCreated} órdenes de compra creadas, ${poLineCreated} líneas\n`);

  // ========================
  // 8. VENTAS (sell transactions)
  // ========================
  console.log('💰 PASO 8: Migrando Ventas...');
  const [sellTxns] = await db.query<any[]>(
    `SELECT t.id, t.contact_id, t.transaction_date, t.final_total, 
            t.total_before_tax, t.discount_amount, t.status, t.invoice_no
     FROM transactions t
     WHERE t.type = 'sell' AND t.is_suspend = 0 AND t.is_quotation = 0
     ORDER BY t.transaction_date ASC`
  );

  const [sellPayments] = await db.query<any[]>(
    `SELECT tp.transaction_id, tp.amount, tp.method
     FROM transaction_payments tp
     INNER JOIN transactions t ON tp.transaction_id = t.id
     WHERE t.type = 'sell'`
  );

  const paymentsBySellTxn: Record<number, any[]> = {};
  for (const sp of sellPayments) {
    if (!paymentsBySellTxn[sp.transaction_id]) paymentsBySellTxn[sp.transaction_id] = [];
    paymentsBySellTxn[sp.transaction_id].push(sp);
  }

  let saleCreated = 0;
  let saleLineCreated = 0;
  let saleSkipped = 0;

  // Necesitamos una categoría ID para OrderLineItem.categoryId
  // La obtenemos de la variante → producto → categoría
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

    if (sellLines.length === 0) { saleSkipped++; continue; }

    // Verificar que todas las variantes existen en el mapa
    const validLines = sellLines.filter((l: any) => !!variantMap[l.variation_id]);
    if (validLines.length === 0) { saleSkipped++; continue; }

    const customerId = tx.contact_id ? (customerMap[tx.contact_id] ?? null) : null;
    const payments = paymentsBySellTxn[tx.id] || [];
    
    // Determinar método de pago principal
    const mainPayment = payments[0];
    let paymentMethod = 'EFECTIVO';
    if (mainPayment) {
      const m = mainPayment.method || '';
      if (m.includes('cash')) paymentMethod = 'EFECTIVO';
      else if (m.includes('bank_transfer') || m.includes('transfer')) paymentMethod = 'TRANSFERENCIA';
      else if (m.includes('card') || m.includes('credit') || m.includes('debit')) paymentMethod = 'TARJETA';
      else paymentMethod = m.toUpperCase() || 'EFECTIVO';
    }

    const grandTotal = safeFloat(tx.final_total);
    const subtotal = safeFloat(tx.total_before_tax);
    const cartDiscountTotal = safeFloat(tx.discount_amount);

    try {
      const orderId = uuidv4();
      const order = await prisma.saleOrder.create({
        data: {
          id: orderId,
          branchId: BRANCH_ID,
          warehouseId: WAREHOUSE_ID,
          source: 'POS_LEGACY',
          customerId,
          subtotal,
          cartDiscountTotal,
          grandTotal,
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
        const qty = Math.round(safeFloat(line.quantity));
        const basePrice = safeFloat(line.unit_price_before_discount) || safeFloat(line.unit_price_inc_tax);
        const discountAmount = safeFloat(line.line_discount_amount);
        const finalPrice = safeFloat(line.unit_price_inc_tax);

        await prisma.orderLineItem.create({
          data: {
            orderId: order.id,
            variantId,
            categoryId,
            quantity: qty,
            basePrice,
            discountAmount,
            finalPrice,
          }
        });
        saleLineCreated++;
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Error en venta ID=${tx.id}: ${e.message}`);
      saleSkipped++;
    }
  }
  console.log(`   ✅ ${saleCreated} ventas creadas, ${saleLineCreated} líneas, ${saleSkipped} omitidas\n`);

  // ========================
  // RESUMEN FINAL
  // ========================
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
  console.log('═══════════════════════════════════════════════');
  console.log(`   📂 Categorías:        ${Object.keys(categoryMap).length}`);
  console.log(`   🏷️  Marcas:            ${Object.keys(brandMap).length}`);
  console.log(`   🏭 Proveedores:       ${Object.keys(supplierMap).length}`);
  console.log(`   👥 Clientes:          ${Object.keys(customerMap).length}`);
  console.log(`   📦 Productos creados: ${prodCreated}`);
  console.log(`   🔹 Variantes creadas: ${varCreated}`);
  console.log(`   📊 Stock levels:      ${stockCreated} creados, ${stockUpdated} actualizados`);
  console.log(`   🛒 Compras:           ${poCreated} órdenes, ${poLineCreated} líneas`);
  console.log(`   💰 Ventas:            ${saleCreated} órdenes, ${saleLineCreated} líneas`);
  console.log('═══════════════════════════════════════════════\n');

  await db.end();
  await app.close();
}

bootstrap().catch((err) => {
  console.error('\n❌ Error fatal en la migración:', err);
  process.exit(1);
});
