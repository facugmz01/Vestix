import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/core/prisma/prisma.service';
import * as fs from 'fs';
import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
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
    if (!vars || vars.length === 0) continue;

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
