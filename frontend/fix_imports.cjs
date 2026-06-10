const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages', 'admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Remove `, Tabs` from any react imports or anywhere else where it was incorrectly injected
  if (content.includes(', Tabs } from \'react\'')) {
    content = content.replace(/, Tabs \} from 'react'/g, "} from 'react'");
    changed = true;
  }
  if (content.includes(', Tabs } from "react"')) {
    content = content.replace(/, Tabs \} from "react"/g, '} from "react"');
    changed = true;
  }
  
  // Also catch generic ", Tabs }" if it got injected in weird places
  // but be careful not to remove it from @/components/ui if it's correct there
  // Actually, let's just remove ALL ", Tabs" and "Tabs, " and "Tabs" from all imports first,
  // then cleanly inject it ONLY in the @/components/ui import.
  
  // Clean all "Tabs" from imports
  // To be safe, let's just remove "Tabs" from the file entirely if it's inside an import block,
  // then we inject it properly.
  
  // A simpler way: just fix the known bad react import:
  content = content.replace(/,\s*Tabs\s*\}/g, '}');
  content = content.replace(/\{\s*Tabs\s*,/g, '{');
  
  // Now we need to ensure Tabs is imported from @/components/ui.
  // Find the @/components/ui import
  const uiImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/components\/ui['"];/g;
  let hasUiImport = false;
  
  content = content.replace(uiImportRegex, (match, p1) => {
    hasUiImport = true;
    const items = p1.split(',').map(s => s.trim()).filter(s => s && s !== 'Tabs');
    items.push('Tabs');
    return `import { \n  ${items.join(', ')}\n} from '@/components/ui';`;
  });
  
  if (!hasUiImport && content.includes('<Tabs')) {
    content = `import { Tabs } from '@/components/ui';\n` + content;
  }

  // Also verify moduleTabs import is clean
  if (!content.includes('from \'@/navigation/moduleTabs\'')) {
     // If missing, we might need to add it, but fix_tabs already added them correctly, we just need to leave it.
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed imports in ${file}`);
}
