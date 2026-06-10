const fs = require('fs');
const path = require('path');

const fileGroups = {
  CATALOG_TABS: ['CatalogPage.tsx', 'AttributesPage.tsx', 'PromotionsPage.tsx', 'PriceInquiryPage.tsx'],
  INVENTORY_TABS: ['InventoryPage.tsx', 'StockMovementsPage.tsx', 'TransfersPage.tsx', 'ReservationsPage.tsx'],
  PURCHASING_TABS: ['PurchasingPage.tsx', 'GoodsReceiptsPage.tsx', 'SuppliersPage.tsx'],
  SALES_TABS: ['SalesPage.tsx', 'ReturnsPage.tsx'],
  FINANCE_TABS: ['CashSessionsPage.tsx', 'PaymentsPage.tsx', 'CurrentAccountsPage.tsx', 'InvoicesPage.tsx'] // Wait, treasury route uses CashSessionsPage maybe? Let's assume it does.
};

const pagesDir = path.join(__dirname, 'src', 'pages', 'admin');

for (const [tabName, files] of Object.entries(fileGroups)) {
  for (const file of files) {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has Tabs
    if (content.includes(`<Tabs items={`)) continue;

    // Add Imports
    if (!content.includes(`import { Tabs }`)) {
      content = content.replace(/import \{.*?\} from '@\/components\/ui';/s, (match) => {
        return match.replace('}', ', Tabs }');
      });
      // If it failed to replace (e.g. multi-line vs single line), we can just append
      if (!content.includes('Tabs }')) {
        content = `import { Tabs } from '@/components/ui';\n` + content;
      }
    }

    if (!content.includes(`import { ${tabName} }`)) {
      content = content.replace(/(import .*?;)/, `$1\nimport { ${tabName} } from '@/navigation/moduleTabs';`);
    }

    // Add Prop
    content = content.replace(/<PageContainer([\s\S]*?)>/, `<PageContainer$1 tabs={<Tabs items={${tabName}} />}>`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file} with ${tabName}`);
  }
}
