const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('=== VENTAS DE ESTAS VARIANTES ===');
console.log(psql(`
SELECT 
  oli.id,
  p.name,
  v.sku,
  v.color,
  v.size,
  oli.quantity,
  oli."basePrice",
  oli."finalPrice",
  oli."historicalCost",
  so."createdAt",
  so.status
FROM sales."OrderLineItem" oli
JOIN catalog."ProductVariant" v ON v.id = oli."variantId"
JOIN catalog."Product" p ON p.id = v."productId"
JOIN sales."SaleOrder" so ON so.id = oli."orderId"
WHERE v."costPrice" <= 0
ORDER BY so."createdAt" DESC;
`));
