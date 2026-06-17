const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

if (!content.includes('previewFeatures = ["multiSchema"]')) {
  content = content.replace(
    'generator client {\n  provider = "prisma-client-js"\n}',
    'generator client {\n  provider = "prisma-client-js"\n  previewFeatures = ["multiSchema"]\n}'
  );
}

if (!content.includes('schemas = [')) {
  content = content.replace(
    'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}',
    'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n  schemas  = ["core", "catalog", "inventory", "sales", "purchasing", "finance", "settings"]\n}'
  );
}

const sectionRegex = /\/\/ ==========================================\n\/\/ \d+[A-Z]?\. (.+) MODULE.*?\n\/\/ ==========================================/g;

const sections = [...content.matchAll(sectionRegex)];

let result = '';
let lastIndex = 0;

const moduleMap = {
  'IDENTITY & RBAC': 'core',
  'OUTBOX EVENT PATTERN': 'core', // Assuming core handles outbox base
  'CORE/LOCATIONS': 'core',
  'CATALOG': 'catalog',
  'COMBOS & BATCHES': 'catalog',
  'PRICING & PROMOTIONS': 'catalog',
  'CUSTOMER & CRM': 'sales', // Or crm, but sales is fine
  'SALES & POINT OF SALE (POS)': 'sales',
  'INVENTORY & STOCK': 'inventory',
  'SUPPLY CHAIN & PURCHASING': 'purchasing',
  'FINANCIALS, PAYMENTS & BILLING': 'finance',
  'AUDITING': 'core',
  'INTEGRATIONS': 'core',
  'SETTINGS': 'settings',
  'NOTIFICATIONS': 'core',
  'NEW MIGRATED MODELS': 'sales'
};

for (let i = 0; i < sections.length; i++) {
  const section = sections[i];
  const nextSection = sections[i + 1];
  
  const moduleNameRaw = section[1].trim();
  let schemaName = 'core';
  for (const [key, value] of Object.entries(moduleMap)) {
    if (moduleNameRaw.includes(key)) {
      schemaName = value;
      break;
    }
  }

  const start = section.index;
  const end = nextSection ? nextSection.index : content.length;
  
  let block = content.substring(start, end);
  
  // Find all models in this block and append @@schema
  block = block.replace(/model \w+ \{[^}]+\}/g, (match) => {
    if (match.includes('@@schema')) return match;
    return match.replace(/\}$/, `\n  @@schema("${schemaName}")\n}`);
  });
  
  // Find all enums
  block = block.replace(/enum \w+ \{[^}]+\}/g, (match) => {
    if (match.includes('@@schema')) return match;
    return match.replace(/\}$/, `\n  @@schema("${schemaName}")\n}`);
  });

  result += content.substring(lastIndex, start) + block;
  lastIndex = end;
}

if (lastIndex === 0) {
  result = content;
}

fs.writeFileSync(schemaPath, result, 'utf8');
console.log('Done modifying schema.prisma');
