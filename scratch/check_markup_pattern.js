const { execSync } = require('child_process');

function psql(query) {
  const b64 = Buffer.from(query).toString('base64');
  const cmd = `podman exec -i vestix-postgres-1 sh -c "echo ${b64} | base64 -d | psql -U erp_admin -d erp_prod"`;
  return execSync(cmd, { encoding: 'utf8' });
}

console.log(psql(`
SELECT 
  count(*) as total_con_costo,
  count(CASE WHEN ABS("basePrice" - ("costPrice" * 1.75)) < 1 THEN 1 END) as con_markup_1_75,
  count(CASE WHEN "basePrice" = "costPrice" THEN 1 END) as con_precio_igual_costo
FROM catalog."ProductVariant"
WHERE "costPrice" > 0;
`));
