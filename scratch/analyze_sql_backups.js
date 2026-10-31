const fs = require('fs');

console.log('=== ANALIZANDO 127_0_0_1 (1).sql (UltimatePOS) ===');
if (fs.existsSync('127_0_0_1 (1).sql')) {
  const content = fs.readFileSync('127_0_0_1 (1).sql', 'utf8');
  console.log('Tamaño:', (content.length / 1024 / 1024).toFixed(2), 'MB');
  
  // Buscar INSERT INTO `variations`
  const varMatches = content.match(/INSERT INTO `variations`[^;]+;/g);
  let totalVariations = 0;
  let variationsWithCost = 0;
  let variationsZeroCost = 0;

  // Let's inspect variation schema
  const schemaMatch = content.match(/CREATE TABLE `variations` \(([\s\S]+?)\) ENGINE/);
  if (schemaMatch) {
    console.log('Columnas de variations:', schemaMatch[1].split('\n').map(l => l.trim()).filter(l => l.startsWith('`')).map(l => l.split(' ')[0]).join(', '));
  }

  // Check if our 4 products exist in 127_0_0_1 (1).sql
  const searchNames = ['Sweater bremer', 'Palazzo rayado', 'Puperon rayado', 'Conjunto rayado', 'bremer brillos'];
  for (const name of searchNames) {
    const found = content.toLowerCase().includes(name.toLowerCase());
    console.log(`¿Existe "${name}" en 127_0_0_1 (1).sql? ->`, found ? 'SÍ' : 'NO');
  }
}

console.log('\n=== ANALIZANDO scratch/vestix_migrated_prod.sql ===');
if (fs.existsSync('scratch/vestix_migrated_prod.sql')) {
  const content = fs.readFileSync('scratch/vestix_migrated_prod.sql', 'utf8');
  console.log('Tamaño:', (content.length / 1024 / 1024).toFixed(2), 'MB');
  const searchNames = ['Sweater bremer', 'Palazzo rayado', 'Puperon rayado', 'Conjunto rayado', 'SKU0013', 'SKU0009', 'SKU0008', 'SKU0010'];
  for (const name of searchNames) {
    const found = content.includes(name);
    console.log(`¿Existe "${name}" en scratch/vestix_migrated_prod.sql? ->`, found ? 'SÍ' : 'NO');
  }
}
