const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log(psql(`
SELECT 
  p.name,
  v.sku,
  v.color,
  v.size,
  v."costPrice",
  v."basePrice",
  COALESCE(SUM(s."physicalQuantity"), 0) as stock_fisico
FROM catalog."ProductVariant" v
JOIN catalog."Product" p ON p.id = v."productId"
LEFT JOIN inventory."StockLevel" s ON s."variantId" = v.id
WHERE v.sku = 'SKU0010-COPY'
GROUP BY p.name, v.sku, v.color, v.size, v."costPrice", v."basePrice";
`));
