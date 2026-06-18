import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/core/prisma/prisma.service';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

function extractTable(sql: string, tableName: string) {
    const regex = new RegExp(`INSERT INTO \\\`${tableName}\\\` \\([^\\)]+\\) VALUES\\s+([\\s\\S]*?);`, 'g');
    let allValues: any[] = [];
    
    const createRegex = new RegExp(`CREATE TABLE \\\`${tableName}\\\` \\(([\\s\\S]*?)\\) ENGINE=`, 'g');
    const createMatch = createRegex.exec(sql);
    let columns: string[] = [];
    if (createMatch) {
        const lines = createMatch[1].split('\n');
        for (const line of lines) {
            const colMatch = line.match(/^\s*\\\`([^\\\`]+)\\\`/);
            if (colMatch) columns.push(colMatch[1]);
        }
    } else return [];

    const matches = Array.from(sql.matchAll(regex));
    for (const match of matches) {
        let valuesStr = match[1];
        let insideString = false;
        let currentRecord: string[] = [];
        let currentValue = "";
        
        for (let i = 0; i < valuesStr.length; i++) {
            const char = valuesStr[i];
            const nextChar = valuesStr[i+1];
            
            if (char === "'" && (i === 0 || valuesStr[i-1] !== '\\')) {
                insideString = !insideString;
                currentValue += char;
            } else if (!insideString && char === ',' && valuesStr[i-1] !== ')') {
                currentRecord.push(currentValue);
                currentValue = "";
            } else if (!insideString && char === '(') {
                currentValue = "";
            } else if (!insideString && char === ')') {
                currentRecord.push(currentValue);
                
                let obj: any = {};
                for (let j = 0; j < columns.length; j++) {
                    let val = currentRecord[j];
                    if (val === undefined) continue;
                    val = val.trim();
                    if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
                    obj[columns[j]] = val;
                }
                allValues.push(obj);
                
                currentRecord = [];
                currentValue = "";
                if (nextChar === ',') i++; 
            } else {
                currentValue += char;
            }
        }
    }
    return allValues;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  // Asume que el archivo SQL está en la raíz del proyecto (ERP)
  const sqlPath = path.resolve(__dirname, '../127_0_0_1 (1).sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ No se encontró el archivo SQL en: ${sqlPath}`);
    process.exit(1);
  }

  console.log('⏳ Leyendo archivo SQL...');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('⏳ Extrayendo datos de la base vieja...');
  const rawCategories = extractTable(sql, 'categories');
  const rawBrands = extractTable(sql, 'brands');
  const rawProducts = extractTable(sql, 'products');
  const rawVariations = extractTable(sql, 'variations');

  console.log(`✅ Encontrados: ${rawCategories.length} categorías, ${rawBrands.length} marcas, ${rawProducts.length} productos, ${rawVariations.length} variantes.`);

  console.log('⏳ Migrando Categorías...');
  const categoriesMap: any = {};
  for (const c of rawCategories) {
    let cat = await prisma.category.findFirst({ where: { name: c.name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: c.name } });
    }
    categoriesMap[c.id] = cat.id;
  }

  console.log('⏳ Migrando Marcas...');
  const brandsMap: any = {};
  for (const b of rawBrands) {
    let brand = await prisma.brand.findFirst({ where: { name: b.name } });
    if (!brand) {
      brand = await prisma.brand.create({ data: { name: b.name } });
    }
    brandsMap[b.id] = brand.id;
  }

  const productsMap: any = {};
  for (const p of rawProducts) {
    productsMap[p.id] = p;
  }

  console.log('⏳ Importando Productos y sus Variantes en Vestix...');
  let createdProducts = 0;
  let createdVariants = 0;

  for (const pId in productsMap) {
    const p = productsMap[pId];
    const vars = rawVariations.filter((v: any) => v.product_id === pId);
    if (!vars || vars.length === 0) continue;

    const isVariable = p.type !== 'single';
    let baseSku = p.sku;
    if (!baseSku || baseSku === 'NULL') {
      baseSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    // Buscamos si el producto ya existe (por SKU) para no duplicarlo
    let product = await prisma.product.findUnique({ where: { baseSku } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: p.name,
          baseSku: baseSku,
          categoryId: categoriesMap[p.category_id],
          brandId: brandsMap[p.brand_id],
          type: isVariable ? 'VARIABLE' : 'SINGLE',
          isActive: true
        }
      });
      createdProducts++;
    }

    // Guardar las variantes
    for (const v of vars) {
      let subSku = v.sub_sku || baseSku;
      let variant = await prisma.productVariant.findUnique({ where: { sku: subSku } });
      if (!variant) {
        let size = v.name === 'DUMMY' ? null : v.name; // DUMMY es el placeholder del sistema viejo para productos simples
        
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: subSku,
            size: size,
            costPrice: parseFloat(v.default_purchase_price) || 0,
            basePrice: parseFloat(v.sell_price_inc_tax) || parseFloat(v.default_sell_price) || 0,
            isActive: true
          }
        });
        createdVariants++;
      }
    }
  }

  console.log(`\n🎉 ¡Importación finalizada con éxito! 🎉`);
  console.log(`🔹 Productos nuevos inyectados: ${createdProducts}`);
  console.log(`🔹 Variantes exactas mapeadas: ${createdVariants}`);
  
  await app.close();
}
bootstrap();
