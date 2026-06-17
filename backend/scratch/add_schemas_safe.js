const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Update generator and datasource
if (!content.includes('previewFeatures = ["multiSchema"]')) {
  content = content.replace(
    /generator client \{\s*provider = "prisma-client-js"\s*\}/m,
    'generator client {\n  provider = "prisma-client-js"\n  previewFeatures = ["multiSchema"]\n}'
  );
}

if (!content.includes('schemas  =')) {
  content = content.replace(
    /datasource db \{\s*provider = "postgresql"\s*url\s*=\s*env\("DATABASE_URL"\)\s*\}/m,
    'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n  schemas  = ["core", "catalog", "inventory", "sales", "purchasing", "finance", "settings"]\n}'
  );
}

const lines = content.split('\n');
const newLines = [];

const moduleMap = {
  'IDENTITY & RBAC': 'core',
  'OUTBOX EVENT PATTERN': 'core',
  'CORE CORE/LOCATIONS': 'core',
  'CATALOG MODULE': 'catalog',
  'COMBOS & BATCHES': 'catalog',
  'PRICING & PROMOTIONS': 'catalog',
  'CUSTOMER & CRM': 'sales',
  'SALES & POINT OF SALE': 'sales',
  'INVENTORY & STOCK': 'inventory',
  'SUPPLY CHAIN & PURCHASING': 'purchasing',
  'FINANCIALS, PAYMENTS & BILLING': 'finance',
  'AUDITING': 'core',
  'INTEGRATIONS': 'core',
  'SETTINGS': 'settings',
  'NOTIFICATIONS': 'core',
  'NEW MIGRATED MODELS': 'sales'
};

let currentSchema = 'core';
let inModelOrEnum = false;
let modelName = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for module comment
  if (line.startsWith('// ==========================================')) {
    const nextLine = lines[i + 1] || '';
    if (nextLine.match(/\/\/ \d+[A-Z]?\. (.+) MODULE/)) {
      for (const [key, value] of Object.entries(moduleMap)) {
        if (nextLine.includes(key)) {
          currentSchema = value;
          break;
        }
      }
    }
  }

  if (line.match(/^(model|enum) \w+ \{/)) {
    inModelOrEnum = true;
    modelName = line.split(' ')[1];
    newLines.push(line);
    continue;
  }

  if (inModelOrEnum && line.startsWith('}')) {
    newLines.push(`  @@schema("${currentSchema}")`);
    newLines.push(line);
    inModelOrEnum = false;
    continue;
  }

  newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'), 'utf8');
console.log('Done safely modifying schema.prisma');
