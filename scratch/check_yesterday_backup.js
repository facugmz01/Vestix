const fs = require('fs');

const path = 'C:/Users/Facundo Gomez/.gemini/antigravity/brain/b5b0d829-accc-4638-8d15-320d66ab6bc0/.user_uploaded/media_1793395492075_2a066f13.sql';
if (fs.existsSync(path)) {
  console.log('Existe el backup de ayer (backup-2026-10-29T23-32-25-594Z.sql)!');
  const content = fs.readFileSync(path, 'utf8');
  console.log('Tamaño:', (content.length / 1024 / 1024).toFixed(2), 'MB');
  
  // Search for the 4 products:
  const searchNames = ['Sweater bremer', 'Palazzo rayado', 'Puperon rayado', 'Conjunto rayado', 'SKU0013', 'SKU0009', 'SKU0008', 'SKU0010'];
  for (const name of searchNames) {
    const found = content.includes(name);
    console.log(`¿Existe "${name}" en el backup de ayer? ->`, found ? 'SÍ' : 'NO');
  }

  // Let's see the COPY statements for ProductVariant in that backup
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('SKU0013') || lines[i].includes('SKU0009') || lines[i].includes('SKU0008') || lines[i].includes('SKU0010')) {
      console.log(`Línea ${i}:`, lines[i].substring(0, 150));
    }
  }
} else {
  console.log('No existe el archivo en la ruta.');
}
