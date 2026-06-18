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
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
    const data = JSON.parse(fs.readFileSync('./extracted_data.json', 'utf8'));
    const categories = {};
    for (const c of data.categories) {
        let cat = await prisma.category.findFirst({ where: { name: c.name } });
        if (!cat) {
            cat = await prisma.category.create({ data: { name: c.name } });
        }
        categories[c.id] = cat.id;
    }
    const brands = {};
    for (const b of data.brands) {
        let brand = await prisma.brand.findFirst({ where: { name: b.name } });
        if (!brand) {
            brand = await prisma.brand.create({ data: { name: b.name } });
        }
        brands[b.id] = brand.id;
    }
    const products = {};
    for (const p of data.products) {
        products[p.id] = p;
    }
    let createdProducts = 0;
    let createdVariants = 0;
    for (const pId in products) {
        const p = products[pId];
        const vars = data.variations.filter(v => v.product_id === pId);
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
                    categoryId: categories[p.category_id],
                    brandId: brands[p.brand_id],
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
    console.log(`Import finished! Created ${createdProducts} products and ${createdVariants} variants.`);
    await app.close();
}
bootstrap();
//# sourceMappingURL=import-to-vestix.js.map