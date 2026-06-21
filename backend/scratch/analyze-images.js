const mysql2 = require('mysql2/promise');

const MYSQL_CONFIG = {
  host: '127.0.0.1', user: 'ultimatepos', password: 'ultimatepos', database: 'ultimatepos',
};

async function analyze() {
  const db = await mysql2.createConnection(MYSQL_CONFIG);
  
  // Ver todas las columnas de la tabla media
  const [cols] = await db.query(`DESCRIBE media`);
  console.log('Columnas de media:');
  for (const c of cols) console.log(`  ${c.Field} (${c.Type})`);
  
  // Ver muestra de datos
  const [rows] = await db.query(`SELECT * FROM media LIMIT 5`);
  console.log('\nMuestra de datos:');
  for (const r of rows) console.log(JSON.stringify(r));
  
  // Ver si los productos con imagen tienen woocommerce_media_id
  const [wc] = await db.query(
    `SELECT id, name, sku, image, woocommerce_product_id, woocommerce_media_id 
     FROM products WHERE image IS NOT NULL AND image != '' AND is_inactive = 0 LIMIT 10`
  );
  console.log('\nProductos con WooCommerce IDs:');
  for (const p of wc) {
    console.log(`  SKU=${p.sku} | img="${p.image}" | wc_prod_id=${p.woocommerce_product_id} | wc_media_id=${p.woocommerce_media_id}`);
  }
  
  await db.end();
}

analyze().catch(console.error);
