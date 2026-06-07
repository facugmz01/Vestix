const fs = require('fs');
const path = require('path');

const basePath = 'c:/Users/Facundo Gomez/Documents/ERP/frontend/src';

const replacements = [
  // Unused imports removal
  { file: 'components/layout/AdminLayout.tsx', search: /import \{ useState \} from 'react';\n/, replace: '' },
  { file: 'components/ui/Modal.tsx', search: /import \{ Button \} from '\.\/Button';\n/, replace: '' },
  { file: 'features/audit/components/AuditLogDetailDrawer.tsx', search: /import \{ useQuery \} from '@tanstack\/react-query';\n/, replace: '' },
  { file: 'features/audit/components/AuditLogDetailDrawer.tsx', search: /Table, /, replace: '' },
  { file: 'features/audit/components/AuditLogDetailDrawer.tsx', search: /import \{ auditApi \} from '@\/api\/audit.api';\n/, replace: '' },
  { file: 'features/audit/components/AuditLogDetailDrawer.tsx', search: /import \{ queryKeys \} from '@\/api\/queryKeys';\n/, replace: '' },
  { file: 'features/cashRegisters/components/CashRegisterDetailDrawer.tsx', search: /Badge, /, replace: '' },
  { file: 'features/finance/components/CashSessionDetailDrawer.tsx', search: /ShieldAlert, /, replace: '' },
  { file: 'features/finance/components/CurrentAccountDetailDrawer.tsx', search: /ArrowDownRight, /, replace: '' },
  { file: 'features/finance/components/CurrentAccountDetailDrawer.tsx', search: /ArrowUpRight, /, replace: '' },
  { file: 'features/finance/components/TreasuryTransactionModal.tsx', search: /Wallet, /, replace: '' },
  { file: 'features/finance/payments/components/MixedPaymentForm.tsx', search: /const getMethodIcon =[^}]+};\n\n/g, replace: '' },
  { file: 'features/integrations/components/IntegrationDetailDrawer.tsx', search: /Input, /, replace: '' },
  { file: 'features/inventory/components/MovementDetailDrawer.tsx', search: /import type \{ EnrichedMovement \} from '\.\/StockMovementsDrawer';\n/, replace: '' },
  { file: 'features/inventory/components/MovementDetailDrawer.tsx', search: /User, /, replace: '' },
  { file: 'features/inventory/components/MovementDetailDrawer.tsx', search: /FileText, /, replace: '' },
  { file: 'features/inventory/components/StockMovementsDrawer.tsx', search: /import \{ queryKeys \} from '@\/api\/queryKeys';\n/, replace: '' },
  { file: 'features/inventory/transfers/components/TransferFormDrawer.tsx', search: /import \{ productsApi \} from '@\/api\/products\.api';\n/, replace: '' },
  { file: 'features/notifications/components/TemplateFormDrawer.tsx', search: /import \{ useState \} from 'react';\n/, replace: '' },
  { file: 'features/notifications/components/TemplateFormDrawer.tsx', search: /Bell, /, replace: '' },
  { file: 'features/offline/components/OfflineStatusBar.tsx', search: /Wifi, /, replace: '' },
  { file: 'features/priceLists/components/PriceListDetailDrawer.tsx', search: /const \{ data: items, isLoading \} =/, replace: 'const { data: items } =' },
  { file: 'features/products/components/ProductActionsMenu.tsx', search: /MoreVertical, /, replace: '' },
  { file: 'features/purchasing/components/PurchaseFormDrawer.tsx', search: /import type \{ CreatePurchaseOrderDto \} from '@\/api\/purchasing\.api';\n/, replace: '' },
  { file: 'features/purchasing/components/PurchaseFormDrawer.tsx', search: /Plus, /, replace: '' },
  { file: 'features/reports/components/SalesReportPanel.tsx', search: /import \{ useState \} from 'react';\n/, replace: '' },
  { file: 'features/reports/components/SalesReportPanel.tsx', search: /RefreshCw, /, replace: '' },
  { file: 'features/reports/components/StockReportPanel.tsx', search: /import \{ useMutation \} from '@tanstack\/react-query';\n/, replace: '' },
  { file: 'features/reports/components/StockReportPanel.tsx', search: /BarChart, /, replace: '' },
  { file: 'features/reports/components/StockReportPanel.tsx', search: /const COLORS = \['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'\];\n\n/, replace: '' },
  { file: 'features/roles/components/RoleFormDrawer.tsx', search: /useMemo, /, replace: '' },
  { file: 'features/sales/returns/components/ReturnDetailDrawer.tsx', search: /RefreshCcw, /, replace: '' },

  // variant="outline" to variant="ghost"
  { file: 'features/purchasing/receipts/components/GoodsReceiptDetailDrawer.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/reports/components/CashReportPanel.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/reports/components/SalesReportPanel.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },
  { file: 'features/reports/components/StockReportPanel.tsx', search: /variant="outline"/g, replace: 'variant="ghost"' },

  // color="orange" to color="warning"
  { file: 'features/purchasing/receipts/components/GoodsReceiptDetailDrawer.tsx', search: /color="orange"/g, replace: 'color="warning"' },
  { file: 'features/reports/components/StockReportPanel.tsx', search: /color="orange"/g, replace: 'color="warning"' },

  // Reports
  { file: 'features/reports/components/SalesReportPanel.tsx', search: /summary.averageTicket/g, replace: 'summary.averageOrderValue' },
  { file: 'features/reports/components/SalesReportPanel.tsx', search: /<KpiCard label="Clientes Únicos"[^>]+ \/>/g, replace: '' },
  { file: 'features/reports/components/SalesReportPanel.tsx', search: /t.productName\?/g, replace: 't.name?' },
  { file: 'features/reports/components/SalesReportPanel.tsx', search: /t.totalQuantity/g, replace: 't.totalUnitsSold' },
  
  { file: 'features/reports/components/StockReportPanel.tsx', search: /l.productName/g, replace: 'l.name' },
  { file: 'features/reports/components/StockReportPanel.tsx', search: /l.branchName/g, replace: 'l.branchId' },
  { file: 'features/reports/components/StockReportPanel.tsx', search: /l.currentStock/g, replace: 'l.availableQuantity' },

  // Purchasing Form
  { file: 'features/purchasing/components/PurchaseFormDrawer.tsx', search: /destinationWarehouseId/g, replace: 'warehouseId' },
  { file: 'features/purchasing/components/PurchaseFormDrawer.tsx', search: /width="1100px"/g, replace: 'width="lg"' },
  
  // MixedPaymentForm unused i map
  { file: 'features/finance/payments/components/MixedPaymentForm.tsx', search: /\(m, i\) =>/g, replace: '(m) =>' },
  { file: 'features/finance/payments/components/MixedPaymentForm.tsx', search: /key=\{i\}/g, replace: 'key={m.method}' },

  // IntegrationDetailDrawer unused setLogsPage
  { file: 'features/integrations/components/IntegrationDetailDrawer.tsx', search: /const \[logsPage, setLogsPage\] = useState\(1\);/g, replace: 'const [logsPage] = useState(1);' },

  // Finance Detail Drawer isMovesLoading
  { file: 'features/finance/components/CashSessionDetailDrawer.tsx', search: /const \{ data: moves, isLoading: isMovesLoading \}/g, replace: 'const { data: moves }' }
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
