const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log(psql(`
SELECT 
  v.sku,
  p.name as product_name,
  poli."unitCost",
  poli."orderedQuantity",
  poli."totalAmount",
  po.id as po_id,
  po.status,
  po."totalAmount" as po_total,
  po."createdAt"
FROM purchasing."POLineItem" poli
JOIN purchasing."PurchaseOrder" po ON po.id = poli."purchaseOrderId"
JOIN catalog."ProductVariant" v ON v.id = poli."variantId"
JOIN catalog."Product" p ON p.id = v."productId"
WHERE poli."unitCost" = 0;
`));
