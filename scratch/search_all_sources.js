const fs = require('fs');

console.log('--- SEARCHING IN articulos_importar.csv ---');
if (fs.existsSync('articulos_importar.csv')) {
  const content = fs.readFileSync('articulos_importar.csv', 'utf8');
  const lines = content.split('\n');
  console.log('Headers:', lines[0]);
  for (const line of lines) {
    if (/rayado|bremer|brillo|0008|0009|0010|0013/i.test(line)) {
      console.log('articulos_importar:', line.trim());
    }
  }
}

console.log('\n--- SEARCHING IN ultimatepos_dump.json ---');
if (fs.existsSync('scratch/ultimatepos_dump.json')) {
  const dump = JSON.parse(fs.readFileSync('scratch/ultimatepos_dump.json', 'utf8'));
  const prods = dump.products || [];
  for (const p of prods) {
    if (/rayado|bremer|brillo/i.test(p.name) || /0008|0009|0010|0013/.test(p.sku || '')) {
      console.log('UPOS product:', p.id, p.name, p.sku, p.type);
    }
  }
  const vars = dump.variations || [];
  for (const v of vars) {
    if (/0008|0009|0010|0013/.test(v.sub_sku || '') || /rayado|bremer|brillo/i.test(v.name || '')) {
      console.log('UPOS variation:', v.id, v.product_id, v.name, v.sub_sku, 'default_purchase_price:', v.default_purchase_price, 'dpp_inc_tax:', v.dpp_inc_tax, 'sell_price:', v.sell_price_inc_tax || v.default_sell_price);
    }
  }
}

console.log('\n--- SEARCHING IN 127_0_0_1 (1).sql ---');
if (fs.existsSync('127_0_0_1 (1).sql')) {
  const sql = fs.readFileSync('127_0_0_1 (1).sql', 'utf8');
  const lines = sql.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/SKU0008|SKU0009|SKU0010|SKU0013|Sweater bremer brillos|Puperon rayado|Palazzo rayado|Conjunto rayado/i.test(line)) {
      console.log(`Line ${i}:`, line.substring(0, 150));
    }
  }
}
