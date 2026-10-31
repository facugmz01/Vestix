const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log(psql(`
SELECT 
  po.id,
  po.status,
  po."totalAmount",
  po."createdAt",
  s."companyName",
  po.notes
FROM purchasing."PurchaseOrder" po
LEFT JOIN purchasing."Supplier" s ON s.id = po."supplierId"
WHERE po.id IN ('65d6020d-9d97-4889-b253-61175ed9bb12', 'fb9ac026-b329-42f5-ad37-2e8e1224ec65');
`));
