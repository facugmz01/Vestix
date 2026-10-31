const { execSync } = require('child_process');

function psql(query) {
  // Pass query via base64 to avoid escaping issues
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('=== PRODUCTOS CON COSTO <= 0 O NULL ===');
console.log(psql(`
SELECT 
  p.id,
  p.name,
  p."baseSku",
  p."costPrice",
  p."isActive",
  c.name as category,
  b.name as brand
FROM catalog."Product" p
LEFT JOIN catalog."Category" c ON p."categoryId" = c.id
LEFT JOIN catalog."Brand" b ON p."brandId" = b.id
WHERE p."costPrice" <= 0 OR p."costPrice" IS NULL
ORDER BY p.name;
`));

console.log('=== VARIANTES CON COSTO <= 0 O NULL ===');
console.log(psql(`
SELECT 
  v.id,
  p.name as product_name,
  v.sku,
  v.barcode,
  v.size,
  v.color,
  v."costPrice",
  v."basePrice",
  v."isActive"
FROM catalog."ProductVariant" v
JOIN catalog."Product" p ON v."productId" = p.id
WHERE v."costPrice" <= 0 OR v."costPrice" IS NULL
ORDER BY p.name, v.sku;
`));
