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
function extractTable(sql, tableName) {
    const regex = new RegExp(`INSERT INTO \\\`${tableName}\\\` \\([^\\)]+\\) VALUES\\s+([\\s\\S]*?);`, 'g');
    let allValues = [];
    const createRegex = new RegExp(`CREATE TABLE \\\`${tableName}\\\` \\(([\\s\\S]*?)\\) ENGINE=`, 'g');
    const createMatch = createRegex.exec(sql);
    let columns = [];
    if (createMatch) {
        const lines = createMatch[1].split('\n');
        for (const line of lines) {
            const colMatch = line.match(/^\s*\\\`([^\\\`]+)\\\`/);
            if (colMatch)
                columns.push(colMatch[1]);
        }
    }
    else
        return [];
    const matches = Array.from(sql.matchAll(regex));
    for (const match of matches) {
        let valuesStr = match[1];
        let insideString = false;
        let currentRecord = [];
        let currentValue = "";
        for (let i = 0; i < valuesStr.length; i++) {
            const char = valuesStr[i];
            const nextChar = valuesStr[i + 1];
            if (char === "'" && (i === 0 || valuesStr[i - 1] !== '\\')) {
                insideString = !insideString;
                currentValue += char;
            }
            else if (!insideString && char === ',' && valuesStr[i - 1] !== ')') {
                currentRecord.push(currentValue);
                currentValue = "";
            }
            else if (!insideString && char === '(') {
                currentValue = "";
            }
            else if (!insideString && char === ')') {
                currentRecord.push(currentValue);
                let obj = {};
                for (let j = 0; j < columns.length; j++) {
                    let val = currentRecord[j];
                    if (val === undefined)
                        continue;
                    val = val.trim();
                    if (val.startsWith("'") && val.endsWith("'"))
                        val = val.substring(1, val.length - 1);
                    obj[columns[j]] = val;
                }
                allValues.push(obj);
                currentRecord = [];
                currentValue = "";
                if (nextChar === ',')
                    i++;
            }
            else {
                currentValue += char;
            }
        }
    }
    return allValues;
}
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
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
    const categoriesMap = {};
    for (const c of rawCategories) {
        let cat = await prisma.category.findFirst({ where: { name: c.name } });
        if (!cat) {
            cat = await prisma.category.create({ data: { name: c.name } });
        }
        categoriesMap[c.id] = cat.id;
    }
    console.log('⏳ Migrando Marcas...');
    const brandsMap = {};
    for (const b of rawBrands) {
        let brand = await prisma.brand.findFirst({ where: { name: b.name } });
        if (!brand) {
            brand = await prisma.brand.create({ data: { name: b.name } });
        }
        brandsMap[b.id] = brand.id;
    }
    const productsMap = {};
    for (const p of rawProducts) {
        productsMap[p.id] = p;
    }
    console.log('⏳ Importando Productos y sus Variantes en Vestix...');
    let createdProducts = 0;
    let createdVariants = 0;
    for (const pId in productsMap) {
        const p = productsMap[pId];
        const vars = rawVariations.filter((v) => v.product_id === pId);
        if (!vars || vars.length === 0)
            continue;
        const isVariable = p.type !== 'single';
        let baseSku = p.sku;
        if (!baseSku || baseSku === 'NULL') {
            baseSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        }
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
        for (const v of vars) {
            let subSku = v.sub_sku || baseSku;
            let variant = await prisma.productVariant.findUnique({ where: { sku: subSku } });
            if (!variant) {
                let size = v.name === 'DUMMY' ? null : v.name;
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
//# sourceMappingURL=importar-sql.js.map