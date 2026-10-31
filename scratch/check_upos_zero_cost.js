const fs = require('fs');

const content = fs.readFileSync('127_0_0_1 (1).sql', 'utf8');

// Match variations
const regex = /INSERT INTO `variations` VALUES\s*([\s\S]+?);/;
const match = content.match(regex);
if (match) {
  const valuesText = match[1];
  // split rows by `),(`
  const rows = valuesText.split(/\),\s*\(/);
  console.log('Total variantes en 127_0_0_1 (1).sql:', rows.length);
  
  let zeroCost = [];
  for (const r of rows) {
    // r: id, name, product_id, sub_sku, product_variation_id, woocommerce_variation_id, variation_value_id, default_purchase_price, dpp_inc_tax, profit_percent, default_sell_price, sell_price_inc_tax ...
    const cols = r.replace(/^\(/, '').replace(/\)$/, '').split(',');
    const id = cols[0];
    const name = cols[1];
    const sub_sku = cols[3];
    const dpp = parseFloat(cols[7]);
    if (!dpp || dpp <= 0) {
      zeroCost.push({ id, name, sub_sku, dpp });
    }
  }
  console.log('Variantes con costo <= 0 en 127_0_0_1 (1).sql:', zeroCost.length);
  if (zeroCost.length > 0) {
    console.log(zeroCost);
  }
}
