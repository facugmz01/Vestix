/**
 * VESTIX ERP + POS - SCRIPT DE MIGRACIÓN FORENSE COMPLETO
 * =======================================================
 * Origen: Ultimate POS MySQL Dump (/app/dump.sql)
 * Destino: Vestix PostgreSQL Multi-Schema (Prisma Client)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ==========================================
// 1. HELPERS Y UTILIDADES
// ==========================================
function safeFloat(val) {
  if (val === null || val === undefined || val === '' || val === 'NULL') return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function safeInt(val) {
  if (val === null || val === undefined || val === '' || val === 'NULL') return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : Math.round(n);
}

function safeName(val, fallback = 'Sin nombre') {
  if (!val || val === 'NULL') return fallback;
  const s = String(val).trim();
  return s === '' ? fallback : s;
}

// ==========================================
// 2. PARSER ROBUSTO DE SQL DUMP MYSQL
// ==========================================
function parseSqlDump(sqlContent) {
  console.log('⏳ Parseando archivo SQL de Ultimate POS...');
  const tableData = {};
  const tableDefs = {};

  // Extraer DDL (columnas de cada CREATE TABLE)
  const createTableRegex = /CREATE TABLE `?([a-zA-Z0-9_]+)`?\s*\(([\s\S]*?)\)\s*ENGINE=/g;
  let match;
  while ((match = createTableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns = [];
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const colMatch = trimmed.match(/^`([a-zA-Z0-9_]+)`/);
      if (colMatch) {
        columns.push(colMatch[1]);
      }
    }
    tableDefs[tableName] = columns;
    tableData[tableName] = [];
  }

  // Extraer INSERT INTO
  const insertRegex = /INSERT INTO `?([a-zA-Z0-9_]+)`?\s*(?:\(([^)]+)\))?\s*VALUES\s*([\s\S]*?);(?:\r?\n|$)/g;
  let insertMatch;
  while ((insertMatch = insertRegex.exec(sqlContent)) !== null) {
    const tableName = insertMatch[1];
    const colNamesRaw = insertMatch[2];
    const valuesRaw = insertMatch[3];

    let cols = [];
    if (colNamesRaw) {
      cols = colNamesRaw.split(',').map(c => c.trim().replace(/`/g, ''));
    } else {
      cols = tableDefs[tableName] || [];
    }

    if (!tableData[tableName]) {
      tableData[tableName] = [];
    }

    // Tokenizar tuplas (...)
    const len = valuesRaw.length;
    let inTuple = false;
    let inString = false;
    let escape = false;
    let tupleStart = -1;

    for (let i = 0; i < len; i++) {
      const char = valuesRaw[i];
      if (char === '\\' && inString) {
        escape = !escape;
        continue;
      }
      if (char === "'" && !escape) {
        inString = !inString;
      }
      if (!inString) {
        if (char === '(' && !inTuple) {
          inTuple = true;
          tupleStart = i + 1;
        } else if (char === ')' && inTuple) {
          inTuple = false;
          const tupleStr = valuesRaw.substring(tupleStart, i);

          // Parsear campos individuales de la tupla
          const fields = [];
          let fStart = 0;
          let fInStr = false;
          let fEsc = false;

          for (let j = 0; j < tupleStr.length; j++) {
            const fc = tupleStr[j];
            if (fc === '\\' && fInStr) {
              fEsc = !fEsc;
              continue;
            }
            if (fc === "'" && !fEsc) {
              fInStr = !fInStr;
            }
            if (fc === ',' && !fInStr) {
              fields.push(tupleStr.substring(fStart, j).trim());
              fStart = j + 1;
            }
            fEsc = false;
          }
          if (fStart <= tupleStr.length) {
            fields.push(tupleStr.substring(fStart).trim());
          }

          const rowObj = {};
          for (let k = 0; k < cols.length; k++) {
            const colName = cols[k];
            let rawVal = k < fields.length ? fields[k] : null;
            let cleanVal = rawVal;
            if (rawVal === 'NULL' || rawVal === null) {
              cleanVal = null;
            } else if (typeof rawVal === 'string' && rawVal.startsWith("'") && rawVal.endsWith("'")) {
              cleanVal = rawVal.substring(1, rawVal.length - 1)
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\r/g, '\r')
                .replace(/\\n/g, '\n')
                .replace(/\\\\/g, '\\');
            }
            rowObj[colName] = cleanVal;
          }
          tableData[tableName].push(rowObj);
        }
      }
      escape = false;
    }
  }

  console.log(`✅ SQL Parseado exitosamente: ${Object.keys(tableData).length} tablas encontradas.`);
  return tableData;
}

// ==========================================
// 3. EJECUCIÓN PRINCIPAL DE MIGRACIÓN
// ==========================================
async function runMigration() {
  console.log('\n======================================================');
  console.log('🚀 INICIANDO MIGRACIÓN AUTOMATIZADA: ULTIMATE POS → VESTIX');
  console.log('======================================================\n');

  const possiblePaths = [
    '/var/www/vestix/127_0_0_1 (1).sql',
    '/app/dump.sql',
    path.resolve(__dirname, '../../127_0_0_1 (1).sql'),
    path.resolve(process.cwd(), '127_0_0_1 (1).sql'),
    path.resolve(process.cwd(), 'dump.sql'),
  ];

  let sqlPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sqlPath = p;
      break;
    }
  }

  if (!sqlPath) {
    throw new Error(`No se encontró el archivo de dump en ninguna de las rutas:\n${possiblePaths.join('\n')}`);
  }
  console.log(`📄 Archivo de dump origen encontrado en: ${sqlPath}`);

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const data = parseSqlDump(sqlContent);

  console.log('🧹 Limpiando tablas operativas previas para migración limpia...');
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        sales."SaleOrderPayment", sales."OrderLineItem", sales."SaleReturnLine", sales."SaleReturn", sales."SaleOrderVariance", sales."ShippingAddress", sales."SaleOrder", sales."Customer",
        purchasing."GoodsReceiptLine", purchasing."GoodsReceipt", purchasing."POLineItem", purchasing."PurchaseOrder", purchasing."Supplier",
        inventory."InventoryMovement", inventory."StockReservation", inventory."StockLevel",
        catalog."PriceHistory", catalog."PriceListEntry", catalog."PriceList", catalog."ProductComboLine", catalog."ProductBarcode", catalog."ProductVariant", catalog."ProductCollectionItem", catalog."ProductCollection", catalog."ProductBatch", catalog."Product", catalog."AttributeValue", catalog."Attribute", catalog."Brand", catalog."Category",
        finance."CashShift", finance."FinancialTransaction", finance."PaymentReceipt", finance."TreasuryReceipt", finance."CurrentAccountMovement", finance."PaymentMethod", finance."CashRegister", finance."FinancialAccount"
      CASCADE;
    `);
    console.log('✅ Tablas limpiadas correctamente.\n');
  } catch (e) {
    console.warn('⚠️  Aviso al limpiar tablas (se continuará normalmente):', e.message);
  }

  // Diccionarios de mapeo de IDs: mysql_id -> vestix_uuid
  const maps = {
    branches: {},
    warehouses: {},
    users: {},
    roles: {},
    categories: {},
    brands: {},
    products: {},
    variants: {},
    customers: {},
    suppliers: {},
    saleOrders: {},
    purchaseOrders: {},
    cashRegisters: {},
    paymentMethods: {},
    financialAccounts: {},
    attributes: {},
    attributeValues: {},
    productCategories: {}, // product_id -> category_uuid
    productNames: {},      // product_id -> name
    variantSkus: {},       // variation_id -> sku
    variantCosts: {},      // variation_id -> cost
    variantPrices: {},     // variation_id -> price
  };

  // ----------------------------------------------------
  // ETAPA 1: ORGANIZACIÓN Y SUCURSAL / ALMACÉN
  // ----------------------------------------------------
  console.log('🏢 ETAPA 1: Configurando Sucursal (Branch) y Almacén (Warehouse)...');
  const biz = data.business?.[0] || {};
  const bizLoc = data.business_locations?.[0] || {};

  const branchName = safeName(bizLoc.name || biz.name, 'Ro Indumentaria');
  const branchCode = safeName(bizLoc.location_id, 'BL0001');

  let branch = await prisma.branch.findFirst({ where: { code: branchCode } });
  if (!branch) {
    branch = await prisma.branch.findFirst({ where: { isMain: true } });
  }

  if (branch) {
    branch = await prisma.branch.update({
      where: { id: branch.id },
      data: {
        name: branchName,
        code: branchCode,
        address: `${bizLoc.landmark || ''} ${bizLoc.city || 'Palmira'}, ${bizLoc.state || 'Mendoza'} ${bizLoc.zip_code || '5584'}`.trim(),
        phone: bizLoc.mobile || null,
        isMain: true,
        isActive: true,
        settings: {
          taxId: biz.tax_number_1 || '',
          posReceiptHeader: branchName,
          posReceiptFooter: 'Gracias por su compra en Ro Indumentaria',
          timezone: biz.time_zone || 'America/Argentina/Mendoza',
        },
      },
    });
  } else {
    branch = await prisma.branch.create({
      data: {
        name: branchName,
        code: branchCode,
        address: `${bizLoc.landmark || ''} ${bizLoc.city || 'Palmira'}, ${bizLoc.state || 'Mendoza'} ${bizLoc.zip_code || '5584'}`.trim(),
        phone: bizLoc.mobile || null,
        isMain: true,
        isActive: true,
        settings: {
          taxId: biz.tax_number_1 || '',
          posReceiptHeader: branchName,
          posReceiptFooter: 'Gracias por su compra en Ro Indumentaria',
          timezone: biz.time_zone || 'America/Argentina/Mendoza',
        },
      },
    });
  }
  maps.branches[bizLoc.id || 1] = branch.id;
  console.log(`   ✅ Branch: "${branch.name}" (ID: ${branch.id})`);

  let warehouse = await prisma.warehouse.findFirst({ where: { branchId: branch.id } });
  if (warehouse) {
    warehouse = await prisma.warehouse.update({
      where: { id: warehouse.id },
      data: {
        name: 'Depósito Central - Ro Indumentaria',
        code: 'WH-001',
        type: 'STORAGE',
        isActive: true,
      },
    });
  } else {
    warehouse = await prisma.warehouse.create({
      data: {
        name: 'Depósito Central - Ro Indumentaria',
        code: 'WH-001',
        type: 'STORAGE',
        isActive: true,
        branchId: branch.id,
      },
    });
  }
  maps.warehouses[1] = warehouse.id;
  console.log(`   ✅ Warehouse: "${warehouse.name}" (ID: ${warehouse.id})\n`);

  // ----------------------------------------------------
  // ETAPA 2: ROLES Y USUARIOS
  // ----------------------------------------------------
  console.log('👥 ETAPA 2: Migrando Roles y Usuarios...');
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  const cashierRole = await prisma.role.findFirst({ where: { name: 'CASHIER' } });

  // Mapeo roles origen
  maps.roles[1] = superAdminRole ? superAdminRole.id : '';
  maps.roles[2] = cashierRole ? cashierRole.id : '';

  const bcrypt = require('bcrypt');
  const defaultPasswordHash = await bcrypt.hash('Admin123!', 10);

  const originUsers = data.users || [];
  for (const u of originUsers) {
    const email = u.email ? u.email.trim().toLowerCase() : `user_${u.id}@roindumentaria.local`;
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Usuario';
    const roleId = u.id === '1' ? (superAdminRole?.id || cashierRole?.id) : (cashierRole?.id || superAdminRole?.id);
    const passHash = u.password ? u.password.replace(/^\$2y\$/, '$2a$') : defaultPasswordHash;

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName,
          password: passHash,
          roleId,
          branchId: branch.id,
          isActive: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          password: passHash,
          roleId,
          branchId: branch.id,
          isActive: true,
        },
      });
    }
    maps.users[u.id] = user.id;
    console.log(`   ✅ Usuario migrado: ${user.fullName} (${user.email}) -> Rol: ${u.id === '1' ? 'SUPER_ADMIN' : 'CASHIER'}`);
  }

  // Asegurar usuario de respaldo admin@erp.com
  let defaultAdmin = await prisma.user.findUnique({ where: { email: 'admin@erp.com' } });
  if (!defaultAdmin) {
    defaultAdmin = await prisma.user.create({
      data: {
        email: 'admin@erp.com',
        fullName: 'Administrador General',
        password: defaultPasswordHash,
        roleId: superAdminRole.id,
        branchId: branch.id,
        isActive: true,
      },
    });
    console.log(`   ✅ Usuario de rescate creado: admin@erp.com (SUPER_ADMIN)`);
  }
  console.log('');

  // ----------------------------------------------------
  // ETAPA 3: FINANZAS, CUENTAS Y MÉTODOS DE PAGO
  // ----------------------------------------------------
  console.log('💳 ETAPA 3: Configurando Cuentas Financieras y Métodos de Pago...');
  let cashAccount = await prisma.financialAccount.findFirst({ where: { name: 'Caja Principal (Efectivo)' } });
  if (!cashAccount) {
    cashAccount = await prisma.financialAccount.create({
      data: {
        name: 'Caja Principal (Efectivo)',
        type: 'CASH',
        currency: 'ARS',
        branchId: branch.id,
        balance: 0,
        isActive: true,
      },
    });
  }
  maps.financialAccounts['cash'] = cashAccount.id;

  let bankAccount = await prisma.financialAccount.findFirst({ where: { name: 'Banco / Transferencias' } });
  if (!bankAccount) {
    bankAccount = await prisma.financialAccount.create({
      data: {
        name: 'Banco / Transferencias',
        type: 'BANK',
        currency: 'ARS',
        branchId: branch.id,
        balance: 0,
        isActive: true,
      },
    });
  }
  maps.financialAccounts['bank_transfer'] = bankAccount.id;

  let cashMethod = await prisma.paymentMethod.findFirst({ where: { name: 'Efectivo' } });
  if (!cashMethod) {
    cashMethod = await prisma.paymentMethod.create({
      data: {
        name: 'Efectivo',
        type: 'CASH',
        accountId: cashAccount.id,
        isActive: true,
      },
    });
  }
  maps.paymentMethods['cash'] = cashMethod.id;

  let bankMethod = await prisma.paymentMethod.findFirst({ where: { name: 'Transferencia Bancaria' } });
  if (!bankMethod) {
    bankMethod = await prisma.paymentMethod.create({
      data: {
        name: 'Transferencia Bancaria',
        type: 'BANK_TRANSFER',
        accountId: bankAccount.id,
        isActive: true,
      },
    });
  }
  maps.paymentMethods['bank_transfer'] = bankMethod.id;

  let defaultPriceList = await prisma.priceList.findFirst({ where: { isDefault: true } });
  if (!defaultPriceList) {
    defaultPriceList = await prisma.priceList.create({
      data: {
        name: 'Lista General / Efectivo',
        code: 'GENERAL',
        type: 'RETAIL',
        currency: 'ARS',
        isDefault: true,
        isActive: true,
      },
    });
  }
  console.log(`   ✅ Cuentas y Métodos de Pago listos: Efectivo (${cashMethod.id}), Transferencia (${bankMethod.id})\n`);

  // ----------------------------------------------------
  // ETAPA 4: CONTACTOS (PROVEEDORES Y CLIENTES)
  // ----------------------------------------------------
  console.log('📇 ETAPA 4: Migrando Contactos (Proveedores y Clientes)...');
  const contacts = data.contacts || [];

  let suppliersCount = 0;
  let customersCount = 0;

  for (const c of contacts) {
    const isSupplier = c.type === 'supplier';
    const isCustomer = c.type === 'customer' || c.type === 'both';

    if (isSupplier) {
      const companyName = safeName(c.supplier_business_name || c.name, 'Proveedor Sin Nombre');
      let supplier = await prisma.supplier.findFirst({ where: { companyName } });
      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            companyName,
            contactName: c.name ? c.name.trim() : null,
            phone: c.mobile ? c.mobile.trim() : null,
            email: c.email ? c.email.trim() : null,
            taxId: c.tax_number ? c.tax_number.trim() : null,
            balance: safeFloat(c.balance),
            currency: 'ARS',
          },
        });
        suppliersCount++;
      }
      maps.suppliers[c.id] = supplier.id;
    }

    if (isCustomer) {
      let fullName = safeName(c.name, 'Cliente Sin Nombre');
      if (c.id === '1') {
        fullName = 'Cliente Mostrador (Walk-In)';
      }

      let customer = await prisma.customer.findFirst({ where: { fullName } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName,
            phone: c.mobile ? c.mobile.trim() : null,
            email: c.email ? c.email.trim() : null,
            taxId: c.tax_number ? c.tax_number.trim() : null,
            taxCondition: 'CONSUMIDOR_FINAL',
            creditLimit: safeFloat(c.credit_limit),
            usedCredit: 0,
            source: 'IMPORT',
            type: 'INDIVIDUAL',
            priceListId: defaultPriceList.id,
            isActive: true,
          },
        });
        customersCount++;
      }
      maps.customers[c.id] = customer.id;
    }
  }
  console.log(`   ✅ Proveedores migrados: ${suppliersCount} | Clientes migrados: ${customersCount}\n`);

  // ----------------------------------------------------
  // ETAPA 5: CLASIFICACIÓN (CATEGORÍAS, MARCAS, ATRIBUTOS)
  // ----------------------------------------------------
  console.log('🏷️  ETAPA 5: Migrando Categorías, Marcas y Atributos de Variación...');

  // 1. Categoría Fallback
  let defaultCategory = await prisma.category.findFirst({ where: { name: 'Sin Categoría' } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: { name: 'Sin Categoría' },
    });
  }

  // 2. Categorías del Dump
  const categories = data.categories || [];
  const rootCats = categories.filter(c => !c.parent_id || c.parent_id === '0' || c.parent_id === 0);
  const childCats = categories.filter(c => c.parent_id && c.parent_id !== '0' && c.parent_id !== 0);

  for (const c of [...rootCats, ...childCats]) {
    const name = safeName(c.name);
    let cat = await prisma.category.findUnique({ where: { name } });
    if (!cat) {
      const parentId = c.parent_id && maps.categories[c.parent_id] ? maps.categories[c.parent_id] : null;
      cat = await prisma.category.create({
        data: { name, parentId },
      });
    }
    maps.categories[c.id] = cat.id;
  }
  console.log(`   ✅ Categorías migradas: ${categories.length} (incluyendo "Sin Categoría")`);

  // 3. Marcas
  const brands = data.brands || [];
  for (const b of brands) {
    const name = safeName(b.name);
    let brand = await prisma.brand.findUnique({ where: { name } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name },
      });
    }
    maps.brands[b.id] = brand.id;
  }
  console.log(`   ✅ Marcas migradas: ${brands.length}`);

  // 4. Atributos (Variation Templates)
  const varTemplates = data.variation_templates || [];
  for (const vt of varTemplates) {
    const name = safeName(vt.name);
    let attr = await prisma.attribute.findUnique({ where: { name } });
    if (!attr) {
      attr = await prisma.attribute.create({ data: { name } });
    }
    maps.attributes[vt.id] = attr.id;
  }

  const varValues = data.variation_value_templates || [];
  for (const vv of varValues) {
    const attrId = maps.attributes[vv.variation_template_id];
    if (attrId) {
      let attrVal = await prisma.attributeValue.findFirst({
        where: { attributeId: attrId, value: safeName(vv.name) },
      });
      if (!attrVal) {
        attrVal = await prisma.attributeValue.create({
          data: {
            attributeId: attrId,
            value: safeName(vv.name),
          },
        });
      }
      maps.attributeValues[vv.id] = attrVal.id;
    }
  }
  console.log(`   ✅ Atributos y valores de variación creados.\n`);

  // ----------------------------------------------------
  // ETAPA 6: CATÁLOGO DE PRODUCTOS Y VARIANTES
  // ----------------------------------------------------
  console.log('👗 ETAPA 6: Migrando Catálogo de Productos y Variantes...');

  // Mapear fotos de media por model_id
  const mediaRows = data.media || [];
  const mediaMap = {};
  for (const m of mediaRows) {
    if (m.model_type && m.model_id && m.file_name) {
      mediaMap[`${m.model_type}_${m.model_id}`] = m.file_name;
    }
  }

  const products = data.products || [];
  const variations = data.variations || [];

  // Mapear variaciones por product_id
  const varsByProd = {};
  for (const v of variations) {
    if (!varsByProd[v.product_id]) varsByProd[v.product_id] = [];
    varsByProd[v.product_id].push(v);
  }

  let createdProductsCount = 0;
  let createdVariantsCount = 0;

  for (const p of products) {
    const categoryId = maps.categories[p.category_id] || defaultCategory.id;
    const brandId = maps.brands[p.brand_id] || null;
    const isVariable = p.type === 'variable';
    const prodType = isVariable ? 'VARIABLE' : 'SINGLE';

    const pVars = varsByProd[p.id] || [];
    const avgCost = pVars.length > 0
      ? pVars.reduce((sum, v) => sum + safeFloat(v.default_purchase_price), 0) / pVars.length
      : 0;

    // Buscar foto de producto si existe
    const prodImage = mediaMap[`App\\Product_${p.id}`];
    const imagesArray = prodImage ? [prodImage] : [];

    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { baseSku: p.sku ? p.sku.trim() : `SKU-${p.id}` },
          { name: safeName(p.name) },
        ],
      },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: safeName(p.name),
          baseSku: p.sku ? p.sku.trim() : `SKU-${p.id}`,
          type: prodType,
          isVariable,
          categoryId,
          brandId,
          costPrice: avgCost,
          isActive: true,
          images: imagesArray,
          metadata: {
            legacy_id: parseInt(p.id, 10),
            source: 'ultimate_pos',
          },
        },
      });
      createdProductsCount++;
    }

    maps.products[p.id] = product.id;
    maps.productCategories[p.id] = categoryId;
    maps.productNames[p.id] = product.name;

    // Migrar Variantes del Producto
    for (const v of pVars) {
      const sku = v.sub_sku ? v.sub_sku.trim() : `${product.baseSku}-${v.id}`;
      const costPrice = safeFloat(v.default_purchase_price);
      const basePrice = safeFloat(v.default_sell_price);

      // Determinar si el nombre corresponde a Talle, Color o DUMMY
      let size = null;
      let color = null;
      const attributes = {};

      const varName = v.name ? v.name.trim() : '';
      if (varName && varName !== 'DUMMY') {
        attributes['nombre_variante'] = varName;
        // Si es número o letra clásica de talle
        if (/^(S|M|L|XL|XXL|Unico|\d{2})$/i.test(varName)) {
          size = varName;
        } else {
          color = varName;
        }
      }

      const varImage = mediaMap[`App\\Variation_${v.id}`];

      let variant = await prisma.productVariant.findUnique({ where: { sku } });
      if (!variant) {
        variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            size,
            color,
            imageUrl: varImage || null,
            costPrice,
            basePrice,
            isActive: true,
            attributes,
          },
        });
        createdVariantsCount++;
      }

      maps.variants[v.id] = variant.id;
      maps.variantSkus[v.id] = variant.sku;
      maps.variantCosts[v.id] = costPrice;
      maps.variantPrices[v.id] = basePrice;
    }
  }

  console.log(`   ✅ Productos creados/migrados: ${createdProductsCount} (Total: ${products.length})`);
  console.log(`   ✅ Variantes creadas/migradas: ${createdVariantsCount} (Total: ${variations.length})\n`);

  // ----------------------------------------------------
  // ETAPA 7: STOCK FÍSICO E INVENTARIO
  // ----------------------------------------------------
  console.log('📦 ETAPA 7: Migrando Stock Físico (StockLevels y Movimientos Iniciales)...');
  const stockRows = data.variation_location_details || [];
  let stockLevelsCount = 0;
  let totalStockUnits = 0;

  for (const s of stockRows) {
    const variantId = maps.variants[s.variation_id];
    if (!variantId) continue;

    const qty = Math.round(safeFloat(s.qty_available));
    totalStockUnits += qty;

    const existingStock = await prisma.stockLevel.findFirst({
      where: {
        variantId,
        warehouseId: warehouse.id,
        batchId: null,
      },
    });

    if (!existingStock) {
      await prisma.stockLevel.create({
        data: {
          variantId,
          warehouseId: warehouse.id,
          branchId: branch.id,
          physicalQuantity: qty,
          availableQuantity: qty,
          reservedQuantity: 0,
        },
      });

      // Crear movimiento de stock inicial para auditoría
      if (qty > 0) {
        await prisma.inventoryMovement.create({
          data: {
            variantId,
            destinationWarehouseId: warehouse.id,
            type: 'INITIAL_STOCK',
            quantity: qty,
            unitCost: maps.variantCosts[s.variation_id] || 0,
            referenceId: 'MIGRATION_INITIAL_STOCK',
          },
        });
      }
      stockLevelsCount++;
    }
  }

  console.log(`   ✅ Balances de Stock creados: ${stockLevelsCount}`);
  console.log(`   ✅ Total de Unidades de Prendas en Stock: ${totalStockUnits} unidades.\n`);

  // ----------------------------------------------------
  // ETAPA 8: COMPRAS HISTÓRICAS (PURCHASE ORDERS & GOODS RECEIPTS)
  // ----------------------------------------------------
  console.log('🛒 ETAPA 8: Migrando Órdenes de Compra y Recepciones de Mercadería...');
  const txPurchases = (data.transactions || []).filter(t => t.type === 'purchase');
  const purchaseLines = data.purchase_lines || [];

  const linesByTx = {};
  for (const pl of purchaseLines) {
    if (!linesByTx[pl.transaction_id]) linesByTx[pl.transaction_id] = [];
    linesByTx[pl.transaction_id].push(pl);
  }

  let poCount = 0;
  let poLinesCount = 0;

  for (const tx of txPurchases) {
    const supplierId = maps.suppliers[tx.contact_id];
    if (!supplierId) {
      console.warn(`   ⚠️  No se encontró proveedor para purchase tx ${tx.id}`);
      continue;
    }

    const txDate = tx.transaction_date ? new Date(tx.transaction_date) : new Date();
    const totalAmount = safeFloat(tx.final_total);

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        destinationWarehouseId: warehouse.id,
        status: 'COMPLETED',
        totalAmount,
        paidAmount: totalAmount,
        discountAmount: safeFloat(tx.discount_amount),
        shippingCost: safeFloat(tx.shipping_charges),
        currency: 'ARS',
        notes: tx.additional_notes || `PO Histórica Ref: ${tx.ref_no || ''}`,
        issuedAt: txDate,
        completedAt: txDate,
        createdAt: txDate,
      },
    });
    maps.purchaseOrders[tx.id] = po.id;
    poCount++;

    const txLines = linesByTx[tx.id] || [];

    // Crear GoodsReceipt para formalizar recepción
    const receipt = await prisma.goodsReceipt.create({
      data: {
        purchaseOrderId: po.id,
        destinationWarehouseId: warehouse.id,
        receivedByUserId: maps.users[tx.created_by] || null,
        status: 'VALIDATED',
        notes: `Recepción automática de migración PO ${tx.ref_no || ''}`,
        createdAt: txDate,
      },
    });

    for (const line of txLines) {
      const variantId = maps.variants[line.variation_id];
      if (!variantId) continue;

      const qty = Math.round(safeFloat(line.quantity));
      const unitCost = safeFloat(line.purchase_price);
      const lineTotal = safeFloat(line.purchase_price_inc_tax) * qty;

      const poLine = await prisma.pOLineItem.create({
        data: {
          purchaseOrderId: po.id,
          variantId,
          orderedQuantity: qty,
          receivedQuantity: qty,
          unitCost,
          discountAmount: safeFloat(line.discount_percent),
          totalAmount: lineTotal,
        },
      });

      await prisma.goodsReceiptLine.create({
        data: {
          receiptId: receipt.id,
          poLineItemId: poLine.id,
          variantId,
          expectedQuantity: qty,
          receivedQuantity: qty,
          difference: 0,
        },
      });

      poLinesCount++;
    }
  }

  console.log(`   ✅ Órdenes de Compra migradas: ${poCount}`);
  console.log(`   ✅ Líneas de Compra y Recepción migradas: ${poLinesCount}\n`);

  // ----------------------------------------------------
  // ETAPA 9: CAJAS REGISTRADORAS Y TURNOS
  // ----------------------------------------------------
  console.log('💵 ETAPA 9: Configurando Caja Registradora y Turnos de Caja...');
  let cashRegister = await prisma.cashRegister.findFirst({ where: { branchId: branch.id } });
  if (!cashRegister) {
    cashRegister = await prisma.cashRegister.create({
      data: {
        name: 'Caja Principal Mostrador',
        code: 'POS-01',
        branchId: branch.id,
        status: 'OPEN',
        isActive: true,
      },
    });
  }

  const originCashRegisters = data.cash_registers || [];
  for (const cr of originCashRegisters) {
    const openedByUserId = maps.users[cr.user_id] || Object.values(maps.users)[0];
    const openedAt = cr.created_at ? new Date(cr.created_at) : new Date();
    const closedAt = cr.closed_at ? new Date(cr.closed_at) : null;
    const status = cr.status === 'close' ? 'CLOSED' : 'OPEN';

    const shift = await prisma.cashShift.create({
      data: {
        cashRegisterId: cashRegister.id,
        openedByUserId,
        closedByUserId: cr.status === 'close' ? openedByUserId : null,
        openingAmount: 0,
        closingAmount: safeFloat(cr.closing_amount),
        expectedAmount: safeFloat(cr.closing_amount),
        difference: 0,
        status,
        openedAt,
        closedAt,
        notes: cr.closing_note || 'Turno migrado desde Ultimate POS',
      },
    });
    maps.cashRegisters[cr.id] = shift.id;
  }
  console.log(`   ✅ Caja Registradora y ${originCashRegisters.length} turnos de caja creados.\n`);

  // ----------------------------------------------------
  // ETAPA 10: VENTAS Y PAGOS (POINT OF SALE)
  // ----------------------------------------------------
  console.log('🛍️  ETAPA 10: Migrando Órdenes de Venta y Pagos...');
  const txSells = (data.transactions || []).filter(t => t.type === 'sell');
  const sellLines = data.transaction_sell_lines || [];
  const payments = data.transaction_payments || [];

  const sellLinesByTx = {};
  for (const sl of sellLines) {
    if (!sellLinesByTx[sl.transaction_id]) sellLinesByTx[sl.transaction_id] = [];
    sellLinesByTx[sl.transaction_id].push(sl);
  }

  const paymentsByTx = {};
  for (const p of payments) {
    if (!paymentsByTx[p.transaction_id]) paymentsByTx[p.transaction_id] = [];
    paymentsByTx[p.transaction_id].push(p);
  }

  let salesCount = 0;
  let salesLinesCount = 0;
  let salesPaymentsCount = 0;

  for (const tx of txSells) {
    const customerId = maps.customers[tx.contact_id] || maps.customers['1'];
    const txDate = tx.transaction_date ? new Date(tx.transaction_date) : new Date();
    const txPayments = paymentsByTx[tx.id] || [];

    const primaryPaymentMethod = txPayments.length > 0 && txPayments[0].method === 'bank_transfer'
      ? 'BANK_TRANSFER'
      : 'CASH';

    const orderId = uuidv4();

    const order = await prisma.saleOrder.create({
      data: {
        id: orderId,
        branchId: branch.id,
        warehouseId: warehouse.id,
        source: 'POS',
        customerId,
        subtotal: safeFloat(tx.total_before_tax),
        cartDiscountTotal: safeFloat(tx.discount_amount),
        grandTotal: safeFloat(tx.final_total),
        paymentMethod: primaryPaymentMethod,
        status: 'COMPLETED',
        issueInvoice: false,
        createdAt: txDate,
        syncedAt: txDate,
        appliedPromotions: [
          { legacyInvoiceNo: tx.invoice_no, legacyId: parseInt(tx.id, 10) },
        ],
      },
    });
    maps.saleOrders[tx.id] = order.id;
    salesCount++;

    // Líneas de Venta
    const lines = sellLinesByTx[tx.id] || [];
    for (const sl of lines) {
      const variantId = maps.variants[sl.variation_id];
      if (!variantId) continue;

      const categoryId = maps.productCategories[sl.product_id] || defaultCategory.id;
      const qty = Math.round(safeFloat(sl.quantity));
      const basePrice = safeFloat(sl.unit_price);
      const discountAmount = safeFloat(sl.line_discount_amount);
      const finalPrice = safeFloat(sl.unit_price_inc_tax);

      await prisma.orderLineItem.create({
        data: {
          orderId: order.id,
          variantId,
          categoryId,
          quantity: qty,
          basePrice,
          discountAmount,
          finalPrice,
          historicalSku: maps.variantSkus[sl.variation_id] || null,
          historicalName: maps.productNames[sl.product_id] || null,
          historicalCost: maps.variantCosts[sl.variation_id] || null,
        },
      });
      salesLinesCount++;
    }

    // Pagos de la Venta
    for (const pay of txPayments) {
      const methodId = pay.method === 'bank_transfer' ? bankMethod.id : cashMethod.id;
      const payDate = pay.paid_on ? new Date(pay.paid_on) : txDate;

      await prisma.saleOrderPayment.create({
        data: {
          orderId: order.id,
          paymentMethodId: methodId,
          amount: safeFloat(pay.amount),
          referenceId: pay.payment_ref_no || null,
          createdAt: payDate,
        },
      });
      salesPaymentsCount++;
    }
  }

  console.log(`   ✅ Ventas migradas: ${salesCount}`);
  console.log(`   ✅ Líneas de venta migradas: ${salesLinesCount}`);
  console.log(`   ✅ Pagos de venta migrados: ${salesPaymentsCount}\n`);

  // ----------------------------------------------------
  // CONCILIACIÓN FINAL Y VALIDACIÓN
  // ----------------------------------------------------
  console.log('======================================================');
  console.log('📊 CONCILIACIÓN FINAL Y VERIFICACIÓN POST-MIGRACIÓN');
  console.log('======================================================');

  const totalBranches = await prisma.branch.count();
  const totalWarehouses = await prisma.warehouse.count();
  const totalUsers = await prisma.user.count();
  const totalSuppliers = await prisma.supplier.count();
  const totalCustomers = await prisma.customer.count();
  const totalCategories = await prisma.category.count();
  const totalBrands = await prisma.brand.count();
  const totalProducts = await prisma.product.count();
  const totalVariants = await prisma.productVariant.count();
  const totalStockLevels = await prisma.stockLevel.count();
  const totalPOs = await prisma.purchaseOrder.count();
  const totalSaleOrders = await prisma.saleOrder.count();
  const totalOrderLines = await prisma.orderLineItem.count();
  const totalOrderPayments = await prisma.saleOrderPayment.count();

  const stockSum = await prisma.stockLevel.aggregate({ _sum: { physicalQuantity: true } });
  const salesSum = await prisma.saleOrder.aggregate({ _sum: { grandTotal: true } });
  const purchasesSum = await prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true } });

  console.log(`- Sucursales:            ${totalBranches}`);
  console.log(`- Almacenes:             ${totalWarehouses}`);
  console.log(`- Usuarios:              ${totalUsers}`);
  console.log(`- Proveedores:           ${totalSuppliers}`);
  console.log(`- Clientes:              ${totalCustomers}`);
  console.log(`- Categorías:            ${totalCategories}`);
  console.log(`- Marcas:                ${totalBrands}`);
  console.log(`- Productos:             ${totalProducts}`);
  console.log(`- Variantes:             ${totalVariants}`);
  console.log(`- Balances de Stock:     ${totalStockLevels}`);
  console.log(`- Unidades Físicas Total: ${stockSum._sum.physicalQuantity}`);
  console.log(`- Órdenes de Compra:     ${totalPOs} (Monto Total: $${purchasesSum._sum.totalAmount?.toLocaleString('es-AR')})`);
  console.log(`- Ventas Registradas:    ${totalSaleOrders} (Monto Total: $${salesSum._sum.grandTotal?.toLocaleString('es-AR')})`);
  console.log(`- Líneas de Venta:       ${totalOrderLines}`);
  console.log(`- Pagos Registrados:     ${totalOrderPayments}`);

  console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE SIN ERRORES!\n');
}

runMigration()
  .catch((err) => {
    console.error('\n❌ ERROR FATAL DURANTE LA MIGRACIÓN:\n', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
