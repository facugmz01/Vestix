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
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
function getColumns(sql, tableName) {
    const startMarker = `CREATE TABLE \`${tableName}\``;
    const startIdx = sql.indexOf(startMarker);
    if (startIdx === -1)
        return [];
    const parenOpen = sql.indexOf('(', startIdx);
    if (parenOpen === -1)
        return [];
    const engineIdx = sql.indexOf(') ENGINE=', parenOpen);
    if (engineIdx === -1)
        return [];
    const tableBody = sql.substring(parenOpen + 1, engineIdx);
    const columns = [];
    const lines = tableBody.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('`'))
            continue;
        const endTick = trimmed.indexOf('`', 1);
        if (endTick === -1)
            continue;
        const colName = trimmed.substring(1, endTick);
        columns.push(colName);
    }
    return columns;
}
function parseInsertValues(sql, tableName) {
    const columns = getColumns(sql, tableName);
    if (columns.length === 0) {
        console.warn(`⚠️  No se encontraron columnas para ${tableName}`);
        return [];
    }
    const marker = `INSERT INTO \`${tableName}\``;
    const results = [];
    let searchFrom = 0;
    while (true) {
        const insertIdx = sql.indexOf(marker, searchFrom);
        if (insertIdx === -1)
            break;
        const valuesIdx = sql.indexOf('VALUES', insertIdx);
        if (valuesIdx === -1)
            break;
        const valuesStart = sql.indexOf('(', valuesIdx);
        if (valuesStart === -1)
            break;
        let semicolonIdx = -1;
        let depth = 0;
        let inStr = false;
        let escape = false;
        for (let i = valuesStart; i < sql.length; i++) {
            const ch = sql[i];
            if (escape) {
                escape = false;
                continue;
            }
            if (ch === '\\') {
                escape = true;
                continue;
            }
            if (ch === "'" && !inStr) {
                inStr = true;
                continue;
            }
            if (ch === "'" && inStr) {
                inStr = false;
                continue;
            }
            if (!inStr) {
                if (ch === '(')
                    depth++;
                else if (ch === ')') {
                    depth--;
                }
                else if (ch === ';' && depth === 0) {
                    semicolonIdx = i;
                    break;
                }
            }
        }
        if (semicolonIdx === -1)
            break;
        const block = sql.substring(valuesStart, semicolonIdx);
        let pos = 0;
        while (pos < block.length) {
            const recStart = block.indexOf('(', pos);
            if (recStart === -1)
                break;
            let fields = [];
            let current = '';
            let fieldDepth = 0;
            let inString = false;
            let esc = false;
            let i = recStart + 1;
            for (; i < block.length; i++) {
                const ch = block[i];
                if (esc) {
                    esc = false;
                    current += ch;
                    continue;
                }
                if (ch === '\\') {
                    esc = true;
                    current += ch;
                    continue;
                }
                if (ch === "'" && !inString) {
                    inString = true;
                    current += ch;
                    continue;
                }
                if (ch === "'" && inString) {
                    inString = false;
                    current += ch;
                    continue;
                }
                if (!inString) {
                    if (ch === '(') {
                        fieldDepth++;
                        current += ch;
                    }
                    else if (ch === ')' && fieldDepth > 0) {
                        fieldDepth--;
                        current += ch;
                    }
                    else if (ch === ')' && fieldDepth === 0) {
                        fields.push(current);
                        i++;
                        break;
                    }
                    else if (ch === ',' && fieldDepth === 0) {
                        fields.push(current);
                        current = '';
                    }
                    else {
                        current += ch;
                    }
                }
                else {
                    current += ch;
                }
            }
            pos = i;
            if (fields.length === 0)
                continue;
            const obj = {};
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
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
    const possiblePaths = [
        path.resolve(__dirname, '../127_0_0_1 (1).sql'),
        path.resolve(__dirname, '../../127_0_0_1 (1).sql'),
        '/var/www/vestix/127_0_0_1 (1).sql',
        '/root/127_0_0_1 (1).sql',
    ];
    let sqlPath = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            sqlPath = p;
            break;
        }
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
    const rawBrands = parseInsertValues(sql, 'brands');
    const rawProducts = parseInsertValues(sql, 'products');
    const rawVariations = parseInsertValues(sql, 'variations');
    console.log(`✅ Extraídos: ${rawCategories.length} categorías | ${rawBrands.length} marcas | ${rawProducts.length} productos | ${rawVariations.length} variantes`);
    if (rawCategories.length === 0 || rawProducts.length === 0) {
        console.error('❌ La extracción falló. ¿El archivo SQL es el correcto?');
        process.exit(1);
    }
    console.log('\n⏳ Migrando Categorías...');
    const categoriesMap = {};
    for (const c of rawCategories) {
        if (!c.name || c.name === 'NULL')
            continue;
        let cat = await prisma.category.findFirst({ where: { name: c.name } });
        if (!cat)
            cat = await prisma.category.create({ data: { name: c.name } });
        categoriesMap[c.id] = cat.id;
    }
    console.log(`   ✅ ${Object.keys(categoriesMap).length} categorías listas`);
    console.log('⏳ Migrando Marcas...');
    const brandsMap = {};
    for (const b of rawBrands) {
        if (!b.name || b.name === 'NULL')
            continue;
        let brand = await prisma.brand.findFirst({ where: { name: b.name } });
        if (!brand)
            brand = await prisma.brand.create({ data: { name: b.name } });
        brandsMap[b.id] = brand.id;
    }
    console.log(`   ✅ ${Object.keys(brandsMap).length} marcas listas`);
    console.log('⏳ Importando Productos y Variantes...');
    const productsMap = {};
    for (const p of rawProducts)
        productsMap[p.id] = p;
    let createdProducts = 0;
    let createdVariants = 0;
    let skippedVariants = 0;
    for (const pId in productsMap) {
        const p = productsMap[pId];
        const vars = rawVariations.filter(v => v.product_id === pId);
        if (!vars || vars.length === 0)
            continue;
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
                }
                catch (e) {
                    console.warn(`   ⚠️  SKU duplicado "${subSku}", omitiendo. ${e.message}`);
                    skippedVariants++;
                }
            }
        }
    }
    console.log(`\n🎉 ¡Importación finalizada con éxito! 🎉`);
    console.log(`🔹 Productos creados:  ${createdProducts}`);
    console.log(`🔹 Variantes creadas:  ${createdVariants}`);
    if (skippedVariants > 0)
        console.log(`⚠️  Variantes omitidas (SKU duplicado): ${skippedVariants}`);
    await app.close();
}
bootstrap();
//# sourceMappingURL=importar-sql.js.map