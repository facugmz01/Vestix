const fs = require('fs');

console.log('--- BUSCANDO PUPERON RAYADO EN 127_0_0_1 (1).sql ---');
const content = fs.readFileSync('127_0_0_1 (1).sql', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('puperon rayado') || lines[i].toLowerCase().includes('rayado finito')) {
    console.log(`Línea ${i}:`, lines[i].substring(0, 200));
  }
}

console.log('\n--- VERIFICANDO VARIANTES Y PRECIOS EN 127_0_0_1 (1).sql ---');
// Let's find product id for Puperon rayado if any
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('INSERT INTO `products`')) {
    const prods = lines[i].split('),(');
    for (const p of prods) {
      if (p.toLowerCase().includes('puperon')) {
        console.log('Producto Puperon:', p.substring(0, 150));
      }
    }
  }
}
