const fs = require('fs');
const path = require('path');

const fileGroups = {
  CATALOG_TABS: ['CatalogPage.tsx', 'AttributesPage.tsx', 'PromotionsPage.tsx', 'PriceInquiryPage.tsx'],
  INVENTORY_TABS: ['InventoryPage.tsx', 'StockMovementsPage.tsx', 'TransfersPage.tsx', 'ReservationsPage.tsx'],
  PURCHASING_TABS: ['PurchasingPage.tsx', 'GoodsReceiptsPage.tsx', 'SuppliersPage.tsx'],
  SALES_TABS: ['SalesPage.tsx', 'ReturnsPage.tsx'],
  FINANCE_TABS: ['CashSessionsPage.tsx', 'PaymentsPage.tsx', 'CurrentAccountsPage.tsx', 'InvoicesPage.tsx']
};

const pagesDir = path.join(__dirname, 'src', 'pages', 'admin');

for (const [tabName, files] of Object.entries(fileGroups)) {
  for (const file of files) {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the bad injection first
    content = content.replace(new RegExp(` tabs={<Tabs items={${tabName}} />}`, 'g'), '');
    
    // Inject it cleanly into the opening PageContainer tag
    // The opening tag is `<PageContainer`
    content = content.replace(/<PageContainer\s/, `<PageContainer\n      tabs={<Tabs items={${tabName}} />}\n      `);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
}
