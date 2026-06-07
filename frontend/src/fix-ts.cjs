const fs = require('fs');
const path = require('path');

const basePath = 'c:/Users/Facundo Gomez/Documents/ERP/frontend/src';

const replacements = [
  // helperText prop removal
  { file: 'features/branches/components/BranchFormDrawer.tsx', search: / helperText="[^"]*"/g, replace: '' },
  { file: 'features/cashRegisters/components/CashRegisterFormDrawer.tsx', search: / helperText="[^"]*"/g, replace: '' },
  { file: 'features/customers/components/CustomerFormDrawer.tsx', search: / helperText="[^"]*"/g, replace: '' },
  { file: 'features/locations/components/LocationFormDrawer.tsx', search: / helperText="[^"]*"/g, replace: '' },
  { file: 'features/priceLists/components/PriceListFormDrawer.tsx', search: / helperText="[^"]*"/g, replace: '' },
  { file: 'features/promotions/components/PromotionFormDrawer.tsx', search: / helperText="[^"]*"/g, replace: '' },

  // variant="outline" to variant="ghost"
  { file: 'features/finance/components/CashSessionDetailDrawer.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/finance/components/TreasuryTransactionModal.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/finance/invoices/components/InvoiceDetailDrawer.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/finance/payments/components/MixedPaymentForm.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/integrations/components/IntegrationDetailDrawer.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/inventory/transfers/components/TransferFormDrawer.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/offline/components/SyncQueuePanel.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/products/components/ProductDetailDrawer.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },

  // color="orange" to color="warning"
  { file: 'features/finance/invoices/components/InvoiceStatusBadge.tsx', search: /color="orange"/g, replace: 'color="warning"' },
  { file: 'features/finance/payments/components/PaymentStatusBadge.tsx', search: /color="orange"/g, replace: 'color="warning"' },
  { file: 'features/inventory/transfers/components/TransferDetailDrawer.tsx', search: /color="orange"/g, replace: 'color="warning"' },
  { file: 'features/purchasing/components/PurchaseDetailDrawer.tsx', search: /color="orange"/g, replace: 'color="warning"' },

  // category -> categoryId in products
  { file: 'features/products/components/ProductDetailDrawer.tsx', search: /product\.category\?/g, replace: 'product.categoryId?' },
  { file: 'features/products/components/ProductTable.tsx', search: /p\.category /g, replace: 'p.categoryId ' },

  // defaultValue -> value or remove in ProductFilters
  { file: 'features/products/components/ProductFilters.tsx', search: /defaultValue=\{search\}/g, replace: 'value={search}' },

  // style props on Section or custom components that don't support it (AuditLogDetailDrawer, CurrentAccountDetailDrawer, SyncQueuePanel)
  { file: 'features/audit/components/AuditLogDetailDrawer.tsx', search: /<Section[^>]*style=\{([^}]+)\}[^>]*>/g, replace: match => match.replace(/ style=\{[^}]+\}/, '') },
  { file: 'features/finance/components/CurrentAccountDetailDrawer.tsx', search: /<Section[^>]*style=\{([^}]+)\}[^>]*>/g, replace: match => match.replace(/ style=\{[^}]+\}/, '') },
  { file: 'features/offline/components/SyncQueuePanel.tsx', search: /<Section[^>]*style=\{([^}]+)\}[^>]*>/g, replace: match => match.replace(/ style=\{[^}]+\}/, '') },

  // formatCurrency import in CustomerDetailDrawer
  { file: 'features/customers/components/CustomerDetailDrawer.tsx', search: /import \{ formatCurrency \} from '@\/utils\/formatters';\n/g, replace: '' },
];

replacements.forEach(({ file, search, replace }) => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Processed', file);
  } else {
    console.warn('File not found', file);
  }
});
