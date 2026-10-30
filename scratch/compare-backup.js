const fs = require('fs');

const sqlPath = 'C:/Users/Facundo Gomez/.gemini/antigravity/brain/9c03f065-d7bd-4ebc-94ba-bc44401daa2a/.user_uploaded/media_1793316764832_b68106da.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');
const lines = sql.split(/\r?\n/);

let inProduct = false;
let inVariant = false;

const dbProducts = new Map(); // id -> product
const dbProductsByBaseSku = new Map(); // baseSku -> product
const dbProductsByName = new Map(); // name.toLowerCase() -> product

const dbVariants = new Map(); // id -> variant
const dbVariantsBySku = new Map(); // sku -> variant
const dbVariantsByProduct = new Map(); // productId -> variant[]

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('COPY catalog."Product" ')) {
    inProduct = true;
    continue;
  }
  if (inProduct && line.startsWith('\\.')) {
    inProduct = false;
    continue;
  }
  if (inProduct) {
    const p = line.split('\t');
    const prod = {
      id: p[0],
      name: p[1],
      baseSku: p[2] === '\\N' ? null : p[2],
      description: p[3] === '\\N' ? null : p[3],
      categoryId: p[4] === '\\N' ? null : p[4],
      brandId: p[5] === '\\N' ? null : p[5],
      type: p[6],
      isVariable: p[7] === 't',
      costPrice: parseFloat(p[9]) || 0,
      isActive: p[10] === 't',
      isPublished: p[11] === 't',
      images: p[12],
    };
    dbProducts.set(prod.id, prod);
    if (prod.baseSku) dbProductsByBaseSku.set(prod.baseSku.trim(), prod);
    if (prod.name) dbProductsByName.set(prod.name.trim().toLowerCase(), prod);
  }

  if (line.startsWith('COPY catalog."ProductVariant" ')) {
    inVariant = true;
    continue;
  }
  if (inVariant && line.startsWith('\\.')) {
    inVariant = false;
    continue;
  }
  if (inVariant) {
    const p = line.split('\t');
    const v = {
      id: p[0],
      productId: p[1],
      sku: p[2],
      barcode: p[3] === '\\N' ? null : p[3],
      size: p[4] === '\\N' ? null : p[4],
      color: p[5] === '\\N' ? null : p[5],
      imageUrl: p[6] === '\\N' ? null : p[6],
      costPrice: parseFloat(p[7]) || 0,
      basePrice: parseFloat(p[8]) || 0,
      isActive: p[9] === 't'
    };
    dbVariants.set(v.id, v);
    dbVariantsBySku.set(v.sku.trim(), v);
    if (!dbVariantsByProduct.has(v.productId)) {
      dbVariantsByProduct.set(v.productId, []);
    }
    dbVariantsByProduct.get(v.productId).push(v);
  }
}

// Read listado_productos_con_variantes.csv
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const csvLines = fs.readFileSync('listado_productos_con_variantes.csv', 'utf8').split(/\r?\n/).filter(Boolean);
const csvRows = [];
for (let i = 1; i < csvLines.length; i++) {
  const cols = parseCSVLine(csvLines[i]);
  // "Nombre","Tipo","Categoría","Marca","Variante","SKU","Código","Costo","Precio Venta","Stock"
  csvRows.push({
    name: cols[0],
    type: cols[1],
    category: cols[2],
    brand: cols[3],
    variant: cols[4],
    sku: cols[5],
    barcode: cols[6],
    cost: parseFloat(String(cols[7]).replace(',', '.')) || 0,
    price: parseFloat(String(cols[8]).replace(',', '.')) || 0,
    stock: parseFloat(String(cols[9]).replace(',', '.')) || 0
  });
}

console.log('Total CSV variants:', csvRows.length);

// Compare variants by SKU
let matchedVariants = 0;
let missingInDb = [];
let costDiscrepancies = [];
let priceDiscrepancies = [];

for (const row of csvRows) {
  const dbV = dbVariantsBySku.get(row.sku);
  if (!dbV) {
    missingInDb.push(row);
  } else {
    matchedVariants++;
    const costDiff = Math.abs(dbV.costPrice - row.cost);
    const priceDiff = Math.abs(dbV.basePrice - row.price);
    if (costDiff > 0.01) {
      costDiscrepancies.push({
        sku: row.sku,
        name: row.name,
        variant: row.variant,
        csvCost: row.cost,
        dbCost: dbV.costPrice,
        dbBasePrice: dbV.basePrice,
        csvBasePrice: row.price
      });
    }
    if (priceDiff > 0.01) {
      priceDiscrepancies.push({
        sku: row.sku,
        name: row.name,
        csvPrice: row.price,
        dbPrice: dbV.basePrice
      });
    }
  }
}

console.log(`Matched variants by SKU: ${matchedVariants} / ${csvRows.length}`);
console.log(`Missing in DB by SKU: ${missingInDb.length}`);
console.log(`Cost discrepancies: ${costDiscrepancies.length}`);
console.log(`Price discrepancies: ${priceDiscrepancies.length}`);

if (missingInDb.length > 0) {
  console.log('\nSample 10 Missing in DB by SKU:');
  console.log(missingInDb.slice(0, 10).map(r => ({ sku: r.sku, name: r.name, variant: r.variant, cost: r.cost })));
}

if (costDiscrepancies.length > 0) {
  console.log('\nSample 15 Cost Discrepancies:');
  console.log(costDiscrepancies.slice(0, 15));
}

// Check products in DB where costPrice == basePrice
let sameCostAndPriceCount = 0;
const sameCostAndPrice = [];
for (const v of dbVariants.values()) {
  if (v.costPrice > 0 && Math.abs(v.costPrice - v.basePrice) < 0.01) {
    sameCostAndPriceCount++;
    if (sameCostAndPrice.length < 10) sameCostAndPrice.push(v);
  }
}
console.log(`\nVariants in DB where costPrice == basePrice: ${sameCostAndPriceCount} / ${dbVariants.size}`);
console.log('Sample same cost & price in DB:', sameCostAndPrice);
