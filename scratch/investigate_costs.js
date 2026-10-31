const fs = require('fs');
const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('=== STOCK Y ÓRDENES DE ESTOS 4 PRODUCTOS ===');
console.log(psql(`
SELECT 
  p.name as product,
  v.sku,
  v."costPrice",
  v."basePrice",
  COALESCE(SUM(s."physicalQuantity"), 0) as stock_fisico,
  COALESCE(SUM(s."availableQuantity"), 0) as stock_disponible,
  (SELECT COUNT(*) FROM purchasing."POLineItem" poli WHERE poli."variantId" = v.id) as compras_count,
  (SELECT COUNT(*) FROM sales."SaleOrderItem" soi WHERE soi."variantId" = v.id) as ventas_count
FROM catalog."ProductVariant" v
JOIN catalog."Product" p ON v."productId" = p.id
LEFT JOIN inventory."StockLevel" s ON s."variantId" = v.id
WHERE v."costPrice" <= 0 OR v."costPrice" IS NULL
GROUP BY p.name, v.sku, v."costPrice", v."basePrice", v.id
ORDER BY p.name, v.sku;
`));

console.log('=== VERIFICAR SI HAY ORDENES DE COMPRA PARA ESTAS VARIANTES ===');
console.log(psql(`
SELECT 
  v.sku,
  poli."unitCost",
  poli."orderedQuantity",
  po."orderNumber",
  po.status,
  po."createdAt"
FROM purchasing."POLineItem" poli
JOIN purchasing."PurchaseOrder" po ON po.id = poli."purchaseOrderId"
JOIN catalog."ProductVariant" v ON v.id = poli."variantId"
WHERE v."costPrice" <= 0;
`));
