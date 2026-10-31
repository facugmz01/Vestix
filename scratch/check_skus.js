const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log(psql(`
SELECT 
  v.id,
  p.name,
  v.sku,
  v."costPrice",
  v."basePrice"
FROM catalog."ProductVariant" v
JOIN catalog."Product" p ON p.id = v."productId"
WHERE v.sku ILIKE '%0010%' OR v.sku ILIKE '%0008%' OR v.sku ILIKE '%0009%' OR v.sku ILIKE '%0013%';
`));
