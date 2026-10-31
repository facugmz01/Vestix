const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log(psql(`
SELECT 
  id,
  name,
  "baseSku",
  "costPrice",
  "createdAt",
  "updatedAt",
  metadata
FROM catalog."Product"
WHERE "costPrice" <= 0 OR "costPrice" IS NULL;
`));
