const fs = require('fs');
const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('=== PRODUCTOS Y SUS VARIANTES CON COSTO 0 ===');
console.log(psql(`
SELECT 
  p.name as product,
  p."baseSku",
  v.sku,
  v.size,
  v.color,
  v."costPrice",
  v."basePrice",
  COALESCE(SUM(s."physicalQuantity"), 0) as stock_fisico,
  COALESCE(SUM(s."availableQuantity"), 0) as stock_disponible,
  (SELECT COUNT(*) FROM purchasing."POLineItem" poli WHERE poli."variantId" = v.id) as compras_count,
  (SELECT COUNT(*) FROM sales."OrderLineItem" oli WHERE oli."variantId" = v.id) as ventas_count
FROM catalog."ProductVariant" v
JOIN catalog."Product" p ON v."productId" = p.id
LEFT JOIN inventory."StockLevel" s ON s."variantId" = v.id
WHERE v."costPrice" <= 0 OR v."costPrice" IS NULL
GROUP BY p.name, p."baseSku", v.sku, v.size, v.color, v."costPrice", v."basePrice", v.id
ORDER BY p.name, v.sku;
`));

console.log('\n=== BUSCAR EN LISTADO CSV (listado_productos_con_variantes.csv) ===');
if (fs.existsSync('listado_productos_con_variantes.csv')) {
  const csv = fs.readFileSync('listado_productos_con_variantes.csv', 'utf8');
  const lines = csv.split('\n');
  const headers = lines[0];
  console.log('Headers:', headers);
  
  const searchTerms = ['Conjunto rayado', 'Palazzo rayado', 'Puperon rayado', 'Sweater bremer brillos', 'SKU0010', 'SKU0009', 'SKU0008', 'SKU0013'];
  for (const line of lines) {
    for (const term of searchTerms) {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        console.log('CSV MATCH:', line.trim());
        break;
      }
    }
  }
}

console.log('\n=== BUSCAR EN ULTIMATEPOS DUMP (ultimatepos_dump.json) ===');
if (fs.existsSync('scratch/ultimatepos_dump.json')) {
  try {
    const dump = JSON.parse(fs.readFileSync('scratch/ultimatepos_dump.json', 'utf8'));
    // search in dump products or variations
    const items = Array.isArray(dump) ? dump : (dump.products || dump.variations || []);
    console.log('Dump loaded, checking entries...');
    // We can iterate dump keys
    for (const key of Object.keys(dump)) {
      console.log('Dump key:', key, Array.isArray(dump[key]) ? `Array(${dump[key].length})` : typeof dump[key]);
    }
  } catch (e) {
    console.log('Error parsing dump:', e.message);
  }
}
