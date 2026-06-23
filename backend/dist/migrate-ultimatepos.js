"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const prisma_service_1 = require("./src/core/prisma/prisma.service");
const mysql2 = __importStar(require("mysql2/promise"));
const uuid_1 = require("uuid");
const MYSQL_CONFIG = {
    host: '127.0.0.1',
    user: 'ultimatepos',
    password: 'ultimatepos',
    database: 'ultimatepos',
};
let BRANCH_ID;
let WAREHOUSE_ID;
let DEFAULT_CATEGORY_ID;
function safeFloat(val) {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
}
function safeInt(val) {
    const n = parseInt(val);
    return isNaN(n) ? 0 : n;
}
function safeName(val) {
    if (!val || val === 'NULL' || val === '')
        return 'Sin nombre';
    return String(val).trim();
}
function mapProductType(type) {
    if (type === 'variable')
        return 'VARIABLE';
    if (type === 'combo')
        return 'COMBO';
    return 'SINGLE';
}
async function bootstrap() {
    console.log('\n🚀 Iniciando migración UltimatePOS → Vestix ERP...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const prisma = app.get(prisma_service_1.PrismaService);
    const db = await mysql2.createConnection(MYSQL_CONFIG);
    console.log('✅ Conectado a MySQL (ultimatepos)');
    console.log('✅ Conectado a PostgreSQL (ERP)\n');
    console.log('📋 Buscando Branch y Warehouse de referencia...');
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch)
        throw new Error('No hay ningún Branch en el ERP. Creá uno primero desde la UI.');
    BRANCH_ID = branch.id;
    console.log(`   Branch: "${branch.name}" (${branch.id})`);
    const warehouse = await prisma.warehouse.findFirst({ where: { branchId: BRANCH_ID, isActive: true } });
    if (!warehouse)
        throw new Error('No hay ningún Warehouse para ese Branch.');
    WAREHOUSE_ID = warehouse.id;
    console.log(`   Warehouse: "${warehouse.name}" (${warehouse.id})\n`);
    const categoryMap = {};
    const brandMap = {};
    const supplierMap = {};
    const customerMap = {};
    const variantMap = {};
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📂 PASO 1: Migrando Categorías...');
    const [catRows] = await db.query(`SELECT id, name, parent_id FROM categories 
     WHERE category_type = 'product' AND deleted_at IS NULL 
     ORDER BY parent_id ASC, id ASC`);
    let catCreated = 0;
    let catExists = 0;
    const rootCats = catRows.filter((c) => !c.parent_id || c.parent_id === 0);
    const childCats = catRows.filter((c) => c.parent_id && c.parent_id !== 0);
    for (const c of [...rootCats, ...childCats]) {
        const name = safeName(c.name);
        let existing = await prisma.category.findFirst({ where: { name } });
        if (!existing) {
            const parentId = c.parent_id && c.parent_id !== 0 ? categoryMap[c.parent_id] ?? null : null;
            existing = await prisma.category.create({ data: { name, parentId } });
            catCreated++;
        }
        else {
            catExists++;
        }
        categoryMap[c.id] = existing.id;
    }
    let defaultCat = await prisma.category.findFirst({ where: { name: 'General' } });
    if (!defaultCat)
        defaultCat = await prisma.category.create({ data: { name: 'General' } });
    DEFAULT_CATEGORY_ID = defaultCat.id;
    console.log(`   ✅ ${catCreated} creadas, ${catExists} ya existían\n`);
    console.log('🏷️  PASO 2: Migrando Marcas...');
    const [brandRows] = await db.query(`SELECT id, name FROM brands WHERE deleted_at IS NULL ORDER BY id ASC`);
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
    console.log('🏭 PASO 3: Migrando Proveedores...');
    const [supplierRows] = await db.query(`SELECT id, supplier_business_name, name, email, mobile, tax_number, balance, credit_limit, address_line_1
     FROM contacts 
     WHERE type = 'supplier' AND deleted_at IS NULL 
     ORDER BY id ASC`);
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
    console.log('👥 PASO 4: Migrando Clientes...');
    const [customerRows] = await db.query(`SELECT id, name, first_name, last_name, contact_type, email, mobile, tax_number, 
            credit_limit, balance, contact_status, address_line_1
     FROM contacts 
     WHERE type = 'customer' AND deleted_at IS NULL AND is_default = 0
     ORDER BY id ASC`);
    let custCreated = 0;
    for (const c of customerRows) {
        const fullName = safeName(c.name || [c.first_name, c.last_name].filter(Boolean).join(' '));
        const type = c.contact_type === 'business' ? 'BUSINESS' : 'INDIVIDUAL';
        let existing = null;
        if (c.tax_number) {
            existing = await prisma.customer.findFirst({ where: { taxId: c.tax_number } });
        }
        if (!existing && c.email) {
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
    console.log('📦 PASO 5: Migrando Productos y Variantes...');
    const [allProducts] = await db.query(`SELECT p.id, p.name, p.type, p.sku, p.brand_id, p.category_id, 
            p.product_description, p.is_inactive
     FROM products p
     WHERE p.is_inactive = 0
     ORDER BY p.id ASC`);
    const [allVariations] = await db.query(`SELECT v.id, v.name, v.product_id, v.sub_sku, v.default_purchase_price, 
            v.sell_price_inc_tax, v.default_sell_price
     FROM variations v
     WHERE v.deleted_at IS NULL
     ORDER BY v.product_id ASC, v.id ASC`);
    const [allBarcodes] = await db.query(`SELECT * FROM barcodes ORDER BY id ASC`);
    const variationsByProduct = {};
    for (const v of allVariations) {
        if (!variationsByProduct[v.product_id])
            variationsByProduct[v.product_id] = [];
        variationsByProduct[v.product_id].push(v);
    }
    const barcodesByVariation = {};
    for (const b of allBarcodes) {
        if (!barcodesByVariation[b.variation_id])
            barcodesByVariation[b.variation_id] = [];
        barcodesByVariation[b.variation_id].push(b.name);
    }
    let prodCreated = 0;
    let varCreated = 0;
    let varSkipped = 0;
    for (const p of allProducts) {
        const variations = variationsByProduct[p.id] || [];
        if (variations.length === 0)
            continue;
        const categoryId = categoryMap[p.category_id] ?? DEFAULT_CATEGORY_ID;
        const brandId = p.brand_id ? (brandMap[p.brand_id] ?? null) : null;
        const productType = mapProductType(p.type);
        let baseSku = p.sku && p.sku !== 'NULL' && p.sku !== '' ? p.sku : `UP-${p.id}`;
        let product = await prisma.product.findUnique({ where: { baseSku } });
        if (!product) {
            const existing = await prisma.product.findFirst({ where: { name: p.name } });
            if (existing) {
                product = existing;
            }
            else {
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
                }
                catch (e) {
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
        for (const v of variations) {
            let varSku = v.sub_sku && v.sub_sku !== 'NULL' && v.sub_sku !== ''
                ? v.sub_sku
                : baseSku;
            const isDummy = v.name === 'DUMMY' || v.name === null;
            const sizeName = isDummy ? null : v.name;
            const costPrice = safeFloat(v.default_purchase_price);
            const basePrice = safeFloat(v.sell_price_inc_tax) || safeFloat(v.default_sell_price);
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
                }
                catch (e) {
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
                    }
                    catch {
                        varSkipped++;
                        continue;
                    }
                }
            }
            variantMap[v.id] = variant.id;
            const extra = barcodesByVariation[v.id] || [];
            for (const bc of extra) {
                if (!bc || bc === varSku)
                    continue;
                try {
                    await prisma.productBarcode.create({
                        data: {
                            variantId: variant.id,
                            barcode: bc,
                            type: 'MANUFACTURER',
                        }
                    });
                }
                catch { }
            }
        }
    }
    console.log(`   ✅ ${prodCreated} productos creados, ${varCreated} variantes creadas, ${varSkipped} omitidas\n`);
    console.log('📊 PASO 6: Migrando Stock (variation_location_details)...');
    const [stockRows] = await db.query(`SELECT vld.variation_id, vld.qty_available
     FROM variation_location_details vld
     INNER JOIN variations v ON vld.variation_id = v.id AND v.deleted_at IS NULL
     WHERE vld.qty_available > 0
     ORDER BY vld.variation_id ASC`);
    let stockCreated = 0;
    let stockUpdated = 0;
    let stockSkipped = 0;
    for (const row of stockRows) {
        const variantId = variantMap[row.variation_id];
        if (!variantId) {
            stockSkipped++;
            continue;
        }
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
            }
            else {
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
        }
        catch (e) {
            stockSkipped++;
        }
    }
    console.log(`   ✅ ${stockCreated} stock levels creados, ${stockUpdated} actualizados, ${stockSkipped} omitidos\n`);
    console.log('🛒 PASO 7: Migrando Órdenes de Compra...');
    const [purchaseTxns] = await db.query(`SELECT t.id, t.contact_id, t.transaction_date, t.final_total, t.discount_amount,
            t.status, t.invoice_no, t.ref_no
     FROM transactions t
     WHERE t.type = 'purchase' AND t.is_suspend = 0
     ORDER BY t.transaction_date ASC`);
    const [purchasePayments] = await db.query(`SELECT tp.transaction_id, tp.amount, tp.method
     FROM transaction_payments tp
     INNER JOIN transactions t ON tp.transaction_id = t.id
     WHERE t.type = 'purchase'`);
    const paymentsByPurchaseTxn = {};
    for (const pp of purchasePayments) {
        if (!paymentsByPurchaseTxn[pp.transaction_id])
            paymentsByPurchaseTxn[pp.transaction_id] = [];
        paymentsByPurchaseTxn[pp.transaction_id].push(pp);
    }
    let poCreated = 0;
    let poLineCreated = 0;
    for (const tx of purchaseTxns) {
        const supplierId = tx.contact_id ? (supplierMap[tx.contact_id] ?? null) : null;
        if (!supplierId)
            continue;
        const [purchaseLines] = await db.query(`SELECT pl.variation_id, pl.quantity, pl.purchase_price, pl.purchase_price_inc_tax
       FROM purchase_lines pl WHERE pl.transaction_id = ?`, [tx.id]);
        if (purchaseLines.length === 0)
            continue;
        const totalAmount = safeFloat(tx.final_total);
        const payments = paymentsByPurchaseTxn[tx.id] || [];
        const paidAmount = payments.reduce((sum, p) => sum + safeFloat(p.amount), 0);
        let poStatus = 'COMPLETED';
        if (tx.status === 'draft')
            poStatus = 'DRAFT';
        else if (tx.status === 'ordered')
            poStatus = 'ISSUED';
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
                if (!variantId)
                    continue;
                const qty = Math.round(safeFloat(line.quantity));
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
        }
        catch (e) {
            console.warn(`   ⚠️  Error en compra ID=${tx.id}: ${e.message}`);
        }
    }
    console.log(`   ✅ ${poCreated} órdenes de compra creadas, ${poLineCreated} líneas\n`);
    console.log('💰 PASO 8: Migrando Ventas...');
    const [sellTxns] = await db.query(`SELECT t.id, t.contact_id, t.transaction_date, t.final_total, 
            t.total_before_tax, t.discount_amount, t.status, t.invoice_no
     FROM transactions t
     WHERE t.type = 'sell' AND t.is_suspend = 0 AND t.is_quotation = 0
     ORDER BY t.transaction_date ASC`);
    const [sellPayments] = await db.query(`SELECT tp.transaction_id, tp.amount, tp.method
     FROM transaction_payments tp
     INNER JOIN transactions t ON tp.transaction_id = t.id
     WHERE t.type = 'sell'`);
    const paymentsBySellTxn = {};
    for (const sp of sellPayments) {
        if (!paymentsBySellTxn[sp.transaction_id])
            paymentsBySellTxn[sp.transaction_id] = [];
        paymentsBySellTxn[sp.transaction_id].push(sp);
    }
    let saleCreated = 0;
    let saleLineCreated = 0;
    let saleSkipped = 0;
    for (const tx of sellTxns) {
        const [sellLines] = await db.query(`SELECT tsl.variation_id, tsl.quantity, tsl.unit_price_inc_tax, 
              tsl.unit_price_before_discount, tsl.line_discount_amount,
              p.category_id as mysql_cat_id
       FROM transaction_sell_lines tsl
       INNER JOIN variations v ON tsl.variation_id = v.id
       INNER JOIN products p ON v.product_id = p.id
       WHERE tsl.transaction_id = ? AND tsl.parent_sell_line_id IS NULL`, [tx.id]);
        if (sellLines.length === 0) {
            saleSkipped++;
            continue;
        }
        const validLines = sellLines.filter((l) => !!variantMap[l.variation_id]);
        if (validLines.length === 0) {
            saleSkipped++;
            continue;
        }
        const customerId = tx.contact_id ? (customerMap[tx.contact_id] ?? null) : null;
        const payments = paymentsBySellTxn[tx.id] || [];
        const mainPayment = payments[0];
        let paymentMethod = 'EFECTIVO';
        if (mainPayment) {
            const m = mainPayment.method || '';
            if (m.includes('cash'))
                paymentMethod = 'EFECTIVO';
            else if (m.includes('bank_transfer') || m.includes('transfer'))
                paymentMethod = 'TRANSFERENCIA';
            else if (m.includes('card') || m.includes('credit') || m.includes('debit'))
                paymentMethod = 'TARJETA';
            else
                paymentMethod = m.toUpperCase() || 'EFECTIVO';
        }
        const grandTotal = safeFloat(tx.final_total);
        const subtotal = safeFloat(tx.total_before_tax);
        const cartDiscountTotal = safeFloat(tx.discount_amount);
        try {
            const orderId = (0, uuid_1.v4)();
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
        }
        catch (e) {
            console.warn(`   ⚠️  Error en venta ID=${tx.id}: ${e.message}`);
            saleSkipped++;
        }
    }
    console.log(`   ✅ ${saleCreated} ventas creadas, ${saleLineCreated} líneas, ${saleSkipped} omitidas\n`);
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
//# sourceMappingURL=migrate-ultimatepos.js.map