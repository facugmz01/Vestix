const mysql = require('mysql2/promise');

async function analyzeDB() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'ultimatepos',
    password: 'ultimatepos',
    database: 'ultimatepos'
  });

  const tables = [
    'products', 'product_variations', 'variations', 'variation_location_details',
    'categories', 'brands', 'contacts', 'transactions', 'transaction_sell_lines',
    'purchase_lines', 'transaction_payments', 'units', 'barcodes',
    'variation_templates', 'variation_value_templates', 'selling_price_groups',
    'product_racks', 'product_locations', 'business_locations', 'business',
    'users', 'tax_rates'
  ];

  const result = {};

  for (const table of tables) {
    const [cols] = await connection.query(`DESCRIBE \`${table}\``);
    const [sample] = await connection.query(`SELECT * FROM \`${table}\` LIMIT 5`);
    result[table] = { columns: cols, sample };
  }

  const fs = require('fs');
  fs.writeFileSync('db-analysis.json', JSON.stringify(result, null, 2));
  console.log('Done! See db-analysis.json');
  await connection.end();
}

analyzeDB().catch(console.error);
