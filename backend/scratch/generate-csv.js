const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'ultimatepos',
      password: 'ultimatepos',
      database: 'ultimatepos',
    });
    console.log('Connected to ultimatepos database!');

    const query = `
      SELECT 
        p.name AS product_name,
        p.type AS product_type,
        c.name AS category_name,
        b.name AS brand_name,
        v.name AS variant_name,
        v.sub_sku AS variant_sku,
        v.default_purchase_price AS cost_price,
        v.sell_price_inc_tax AS sell_price,
        COALESCE(SUM(vld.qty_available), 0) AS stock_qty
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      JOIN variations v ON p.id = v.product_id
      LEFT JOIN variation_location_details vld ON v.id = vld.variation_id
      WHERE v.deleted_at IS NULL AND p.is_inactive = 0
      GROUP BY v.id
      ORDER BY p.name, v.id;
    `;

    const [rows] = await connection.query(query);
    console.log(`Fetched ${rows.length} product/variation records.`);

    // Expected headers by the React ImportProductsModal
    const headers = [
      'Nombre',
      'SKU',
      'Código',
      'Categoría',
      'Marca',
      'Costo',
      'Precio Venta',
      'Stock'
    ];

    const csvLines = [headers.map(escapeCsv).join(',')];

    for (const row of rows) {
      const isVariable = row.product_type === 'variable';
      const variantName = (row.variant_name === 'DUMMY' || row.variant_name === 'NULL') ? 'Única' : row.variant_name;
      
      // Combine name with variant name if it is variable to make it unique and descriptive
      const name = isVariable && variantName !== 'Única'
        ? `${row.product_name} - ${variantName}`
        : row.product_name;

      const cost = parseFloat(row.cost_price).toFixed(2);
      const sell = parseFloat(row.sell_price).toFixed(2);
      const stock = Math.max(0, Math.round(parseFloat(row.stock_qty)));

      const line = [
        name,
        row.variant_sku || '',
        '', // Código / Barcode - can be empty
        row.category_name || '',
        row.brand_name || '',
        cost,
        sell,
        stock
      ];

      csvLines.push(line.map(escapeCsv).join(','));
    }

    const csvContent = csvLines.join('\n');
    const outputPath = path.resolve(__dirname, '../../listado_productos_con_variantes.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV successfully written to ${outputPath}`);
  } catch (error) {
    console.error('Error querying MySQL and generating CSV:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
