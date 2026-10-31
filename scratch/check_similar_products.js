const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('=== SWEATERS EN CATALOGO ===');
console.log(psql(`
SELECT 
  p.name,
  v.sku,
  v."costPrice",
  v."basePrice",
  ROUND((v."basePrice" / NULLIF(v."costPrice", 0))::numeric, 2) as markup
FROM catalog."ProductVariant" v
JOIN catalog."Product" p ON p.id = v."productId"
WHERE p.name ILIKE '%sweater%' OR p.name ILIKE '%bremer%'
ORDER BY p.name;
`));

console.log('=== PALAZZOS / CONJUNTOS / PUPERONES ===');
console.log(psql(`
SELECT 
  p.name,
  v.sku,
  v."costPrice",
  v."basePrice"
FROM catalog."ProductVariant" v
JOIN catalog."Product" p ON p.id = v."productId"
WHERE p.name ILIKE '%palazzo%' OR p.name ILIKE '%conjunto%' OR p.name ILIKE '%puperon%'
ORDER BY p.name;
`));
