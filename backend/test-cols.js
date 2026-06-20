const fs = require('fs');
const sql = fs.readFileSync('../127_0_0_1 (1).sql', 'utf8');

const createRegex = new RegExp(`CREATE TABLE \\\`categories\\\` \\(([\\s\\S]*?)\\) ENGINE=`, 'g');
const createMatch = createRegex.exec(sql);
let columns = [];
if (createMatch) {
    const lines = createMatch[1].split('\n');
    for (const line of lines) {
        const colMatch = line.match(/^\s*\\\`([^\\\`]+)\\\`/);
        if (colMatch) columns.push(colMatch[1]);
    }
}
console.log('Columns:', columns);
