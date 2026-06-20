import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/core/prisma/prisma.service';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

// Extrae los nombres de columna del CREATE TABLE (sin regex complejas)
function getColumns(sql: string, tableName: string): string[] {
  const startMarker = `CREATE TABLE \`${tableName}\``;
  const startIdx = sql.indexOf(startMarker);
  if (startIdx === -1) return [];

  const parenOpen = sql.indexOf('(', startIdx);
  if (parenOpen === -1) return [];

  // Avanzar hasta el ENGINE= para encontrar el fin
  const engineIdx = sql.indexOf(') ENGINE=', parenOpen);
  if (engineIdx === -1) return [];

  const tableBody = sql.substring(parenOpen + 1, engineIdx);
  const columns: string[] = [];
  const lines = tableBody.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('`')) continue;
    const endTick = trimmed.indexOf('`', 1);
    if (endTick === -1) continue;
    const colName = trimmed.substring(1, endTick);
    columns.push(colName);
  }
  return columns;
}

// Divide los VALUES de un INSERT INTO respetando strings con comillas
function parseInsertValues(sql: string, tableName: string): Record<string, string>[] {
  const columns = getColumns(sql, tableName);
  if (columns.length === 0) {
    console.warn(`⚠️  No se encontraron columnas para ${tableName}`);
    return [];
  }

  const marker = `INSERT INTO \`${tableName}\``;
  const results: Record<string, string>[] = [];

  let searchFrom = 0;
  while (true) {
    const insertIdx = sql.indexOf(marker, searchFrom);
    if (insertIdx === -1) break;

    // Saltar hasta VALUES
    const valuesIdx = sql.indexOf('VALUES', insertIdx);
    if (valuesIdx === -1) break;

    const valuesStart = sql.indexOf('(', valuesIdx);
    if (valuesStart === -1) break;

    // Encontrar el ; que termina esta sentencia
    let semicolonIdx = -1;
    let depth = 0;
    let inStr = false;
    let escape = false;
    for (let i = valuesStart; i < sql.length; i++) {
      const ch = sql[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === "'" && !inStr) { inStr = true; continue; }
      if (ch === "'" && inStr) { inStr = false; continue; }
      if (!inStr) {
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; }
        else if (ch === ';' && depth === 0) { semicolonIdx = i; break; }
      }
    }
    if (semicolonIdx === -1) break;

    const block = sql.substring(valuesStart, semicolonIdx);

    // Parsear registros uno a uno
    let pos = 0;
    while (pos < block.length) {
      const recStart = block.indexOf('(', pos);
      if (recStart === -1) break;

      let fields: string[] = [];
      let current = '';
      let fieldDepth = 0;
      let inString = false;
      let esc = false;
      let i = recStart + 1;
      for (; i < block.length; i++) {
        const ch = block[i];
        if (esc) { esc = false; current += ch; continue; }
        if (ch === '\\') { esc = true; current += ch; continue; }
        if (ch === "'" && !inString) { inString = true; current += ch; continue; }
        if (ch === "'" && inString) { inString = false; current += ch; continue; }
        if (!inString) {
          if (ch === '(') { fieldDepth++; current += ch; }
          else if (ch === ')' && fieldDepth > 0) { fieldDepth--; current += ch; }
          else if (ch === ')' && fieldDepth === 0) { fields.push(current); i++; break; }
          else if (ch === ',' && fieldDepth === 0) { fields.push(current); current = ''; }
          else { current += ch; }
        } else { current += ch; }
      }
      pos = i;

      if (fields.length === 0) continue;

      const obj: Record<string, string> = {};
      for (let j = 0; j < columns.length && j < fields.length; j++) {
        let val = fields[j].trim();
        if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1).replace(/\\'/g, "'");
        }
        obj[columns[j]] = val;
      }
      results.push(obj);
    }

    searchFrom = semicolonIdx + 1;
  }

  return results;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  // Buscar el SQL en distintas rutas posibles
  const possiblePaths = [
    path.resolve(__dirname, '../127_0_0_1 (1).sql'),
    path.resolve(__dirname, '../../127_0_0_1 (1).sql'),
    '/var/www/vestix/127_0_0_1 (1).sql',
    '/root/127_0_0_1 (1).sql',
  ];

  let sqlPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { sqlPath = p; break; }
  }

  if (!sqlPath) {
    console.error(`❌ No se encontró el archivo SQL. Colócalo en /var/www/vestix/ y vuelve a intentarlo.`);
    console.error(`   Rutas buscadas:\n   ${possiblePaths.join('\n   ')}`);
    process.exit(1);
  }

  console.log(`✅ Archivo SQL encontrado: ${sqlPath}`);
  console.log('⏳ Leyendo archivo SQL...');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('⏳ Extrayendo datos...');
  const rawCategories = parseInsertValues(sql, 'categories');
  const rawBrands     = parseInsertValues(sql, 'brands');
  const rawProducts   = parseInsertValues(sql, 'products');
  const rawVariations = parseInsertValues(sql, 'variations');

  console.log(`✅ Extraídos: ${rawCategories.length} categorías | ${rawBrands.length} marcas | ${rawProducts.length} productos | ${rawVariations.length} variantes`);

  if (rawCategories.length === 0 || rawProducts.length === 0) {
    console.error('❌ La extracción falló. ¿El archivo SQL es el correcto?');
    process.exit(1);
  }

  // --- Categorías ---
  console.log('\n⏳ Migrando Categorías...');
  const categoriesMap: Record<string, string> = {};
  for (const c of rawCategories) {
    if (!c.name || c.name === 'NULL') continue;
    let cat = await prisma.category.findFirst({ where: { name: c.name } });
    if (!cat) cat = await prisma.category.create({ data: { name: c.name } });
    categoriesMap[c.id] = cat.id;
  }
  console.log(`   ✅ ${Object.keys(categoriesMap).length} categorías listas`);

  // --- Marcas ---
  console.log('⏳ Migrando Marcas...');
  const brandsMap: Record<string, string> = {};
  for (const b of rawBrands) {
    if (!b.name || b.name === 'NULL') continue;
    let brand = await prisma.brand.findFirst({ where: { name: b.name } });
    if (!brand) brand = await prisma.brand.create({ data: { name: b.name } });
    brandsMap[b.id] = brand.id;
  }
  console.log(`   ✅ ${Object.keys(brandsMap).length} marcas listas`);

  // --- Productos y Variantes ---
  console.log('⏳ Importando Productos y Variantes...');
  const productsMap: Record<string, any> = {};
  for (const p of rawProducts) productsMap[p.id] = p;

  let createdProducts = 0;
  let createdVariants = 0;
  let skippedVariants = 0;

  for (const pId in productsMap) {
    const p = productsMap[pId];
    const vars = rawVariations.filter(v => v.product_id === pId);
    if (!vars || vars.length === 0) continue;

    const isVariable = p.type !== 'single';
    let baseSku = p.sku;
    if (!baseSku || baseSku === 'NULL' || baseSku === '') {
      baseSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    let product = await prisma.product.findUnique({ where: { baseSku } });
    if (!product) {
      const categoryId = categoriesMap[p.category_id];
      if (!categoryId) {
        console.warn(`   ⚠️  Sin categoría para producto "${p.name}" (cat_id=${p.category_id}), omitiendo.`);
        continue;
      }
      product = await prisma.product.create({
        data: {
          name: p.name,
          baseSku,
          categoryId,
          brandId: brandsMap[p.brand_id] || null,
          type: isVariable ? 'VARIABLE' : 'SINGLE',
          isActive: true,
        }
      });
      createdProducts++;
    }

    for (const v of vars) {
      const subSku = (v.sub_sku && v.sub_sku !== 'NULL') ? v.sub_sku : baseSku;
      let variant = await prisma.productVariant.findUnique({ where: { sku: subSku } });
      if (!variant) {
        const size = (!v.name || v.name === 'DUMMY' || v.name === 'NULL') ? null : v.name;
        try {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: subSku,
              size,
              costPrice: parseFloat(v.default_purchase_price) || 0,
              basePrice: parseFloat(v.sell_price_inc_tax) || parseFloat(v.default_sell_price) || 0,
              isActive: true,
            }
          });
          createdVariants++;
        } catch (e: any) {
          console.warn(`   ⚠️  SKU duplicado "${subSku}", omitiendo. ${e.message}`);
          skippedVariants++;
        }
      }
    }
  }

  console.log(`\n🎉 ¡Importación finalizada con éxito! 🎉`);
  console.log(`🔹 Productos creados:  ${createdProducts}`);
  console.log(`🔹 Variantes creadas:  ${createdVariants}`);
  if (skippedVariants > 0) console.log(`⚠️  Variantes omitidas (SKU duplicado): ${skippedVariants}`);

  await app.close();
}

bootstrap();
