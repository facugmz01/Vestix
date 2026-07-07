import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary }    from '@/components/ErrorBoundary';
import { PageSpinner }      from '@/components/ui/Spinner';
import { useAuthInit }      from '@/hooks/useAuthInit';
import { useSyncEngine }    from '@/hooks/useSyncEngine';
import { OfflineStatusBar } from '@/features/offline/components/OfflineStatusBar';
import { AdminLayout }      from '@/components/layout/AdminLayout';
import { AuthLayout }       from '@/components/layout/AuthLayout';
import { isStorefrontDomain } from '@/utils/storefrontDomain';

// ─── Route guards from rbac module ───────────────────────────────────────────
import {
  RequireAuth,
  RequireGuest,
  RequirePermission,
} from '@/rbac/RouteGuards';

// ─── Auth & error pages ───────────────────────────────────────────────────────
const LoginPage     = lazy(() => import('@/pages/auth/LoginPage'));
const ForbiddenPage = lazy(() => import('@/pages/auth/ForbiddenPage'));
const SetupWizardPage = lazy(() => import('@/pages/setup/SetupWizardPage'));

// ─── Admin pages (code-split per route) ──────────────────────────────────────
const CatalogPage    = lazy(() => import('@/pages/admin/CatalogPage'));
const NewProductPage = lazy(() => import('@/pages/admin/NewProductPage'));
const EditProductPage = lazy(() => import('@/pages/admin/EditProductPage'));
const AttributesPage = lazy(() => import('@/pages/admin/AttributesPage'));
const ProductVariantsPage = lazy(() => import('@/pages/admin/ProductVariantsPage'));
const PromotionsPage = lazy(() => import('@/pages/admin/PromotionsPage'));
const BarcodeLabelsPage = lazy(() => import('@/pages/admin/BarcodeLabelsPage'));
const LabelTemplatesPage = lazy(() => import('@/pages/admin/LabelTemplatesPage'));
const LabelTemplateEditorPage = lazy(() => import('@/pages/admin/LabelTemplateEditorPage'));
const InventoryPage  = lazy(() => import('@/pages/admin/InventoryPage'));
const StockMovementsPage = lazy(() => import('@/pages/admin/StockMovementsPage'));
const TransfersPage  = lazy(() => import('@/pages/admin/TransfersPage'));
const ReservationsPage = lazy(() => import('@/pages/admin/ReservationsPage'));
const PurchasingPage = lazy(() => import('@/pages/admin/PurchasingPage'));
const NewPurchasePage = lazy(() => import('@/pages/admin/NewPurchasePage'));
const GoodsReceiptsPage = lazy(() => import('@/pages/admin/GoodsReceiptsPage'));
const SuppliersPage  = lazy(() => import('@/pages/admin/SuppliersPage'));
const SalesPage      = lazy(() => import('@/pages/admin/SalesPage'));
const SalesFulfillmentPage = lazy(() => import('@/pages/admin/SalesFulfillmentPage'));
const ReturnsPage    = lazy(() => import('@/pages/admin/ReturnsPage'));
const CustomersPage  = lazy(() => import('@/pages/admin/CustomersPage'));
const CurrentAccountsPage = lazy(() => import('@/pages/admin/CurrentAccountsPage'));
const CashSessionsPage = lazy(() => import('@/pages/admin/CashSessionsPage'));
const PaymentsPage   = lazy(() => import('@/pages/admin/PaymentsPage'));
const InvoicesPage   = lazy(() => import('@/pages/admin/InvoicesPage'));
const POSPage        = lazy(() => import('@/pages/pos/POSPage'));
const ReportsPage    = lazy(() => import('@/pages/admin/ReportsPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'));
const AuditPage      = lazy(() => import('@/pages/admin/AuditPage'));
const SyncStatusPage = lazy(() => import('@/pages/admin/SyncStatusPage'));
const SettingsPage   = lazy(() => import('@/pages/admin/SettingsPage'));
const UsersPage      = lazy(() => import('@/pages/admin/UsersPage'));
const RolesPage      = lazy(() => import('@/pages/admin/RolesPage'));
const BranchesPage   = lazy(() => import('@/pages/admin/BranchesPage'));
const WarehousesPage = lazy(() => import('@/pages/admin/WarehousesPage'));
const LocationsPage  = lazy(() => import('@/pages/admin/LocationsPage'));
const CashRegistersPage = lazy(() => import('@/pages/admin/CashRegistersPage'));
const PriceInquiryPage = lazy(() => import('@/pages/admin/PriceInquiryPage'));
const PriceListsPage = lazy(() => import('@/pages/admin/PriceListsPage'));
const QRScannerPage  = lazy(() => import('@/pages/admin/QRScannerPage'));

// ─── Standalone pages ─────────────────────────────────────────────────────────
const StorefrontLayout = lazy(() => import('@/layouts/StorefrontLayout'));
const OnlineCatalogPage = lazy(() => import('@/pages/storefront/OnlineCatalogPage'));
const OnlineProductDetailPage = lazy(() => import('@/pages/storefront/OnlineProductDetailPage'));
const StorefrontCartPage = lazy(() => import('@/pages/storefront/StorefrontCartPage'));
const StorefrontCheckoutPage = lazy(() => import('@/pages/storefront/StorefrontCheckoutPage'));
const StorefrontMyOrdersPage = lazy(() => import('@/pages/storefront/StorefrontMyOrdersPage'));
const StorefrontLoginPage = lazy(() => import('@/pages/storefront/StorefrontLoginPage'));

import { useThemeStore }    from '@/store/theme.store';

export default function App() {
  const isBooting = useAuthInit();
  const navigate  = useNavigate();
  const theme = useThemeStore(s => s.theme);
  
  useSyncEngine(); // global sync engine — mounts once, drains queue on reconnect

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Global 403 event listener dispatched by the Axios interceptor
  useEffect(() => {
    const handle = () => navigate('/forbidden', { replace: true });
    window.addEventListener('erp:forbidden', handle);
    return () => window.removeEventListener('erp:forbidden', handle);
  }, [navigate]);

  if (isBooting) return <PageSpinner />;

  return (
    <ErrorBoundary>
      {/* Ambient background orbs for Apple Vision glassmorphism effect */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <OfflineStatusBar />
      <Suspense fallback={<PageSpinner />}>
        <Routes>

          {/* ── Setup wizard (first launch) ── */}
          <Route path="/setup" element={<SetupWizardPage />} />

          {/* ── Auth zone ── */}
          <Route element={<RequireGuest />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Route>

          {/* ── Error pages (accessible regardless of auth) ── */}
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* ── Storefront: Public store routes ── */}
          {/* Always available at /store/* on the admin domain */}
          {/* On the storefront domain, also maps to root /* */}
          <Route element={<StorefrontLayout />}>
            <Route path="/store" element={<OnlineCatalogPage />} />
            <Route path="/store/product/:id" element={<OnlineProductDetailPage />} />
            <Route path="/store/cart" element={<StorefrontCartPage />} />
            <Route path="/store/checkout" element={<StorefrontCheckoutPage />} />
            <Route path="/store/my-orders" element={<StorefrontMyOrdersPage />} />
            <Route path="/store/login" element={<StorefrontLoginPage />} />

            {isStorefrontDomain() && (
              <>
                <Route path="/" element={<OnlineCatalogPage />} />
                <Route path="/product/:id" element={<OnlineProductDetailPage />} />
                <Route path="/cart" element={<StorefrontCartPage />} />
                <Route path="/checkout" element={<StorefrontCheckoutPage />} />
                <Route path="/my-orders" element={<StorefrontMyOrdersPage />} />
                <Route path="/login" element={<StorefrontLoginPage />} />
              </>
            )}
          </Route>

          {/* ── Admin zone ── */}
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              {!isStorefrontDomain() && <Route index element={<Navigate to="/admin" replace />} />}
              <Route path="/admin" element={<ReportsPage />} />

              <Route element={<RequirePermission action="read"   subject="Catalog" />}>
                <Route path="/admin/catalog"    element={<CatalogPage />} />
                <Route path="/admin/catalog/new" element={<NewProductPage />} />
                <Route path="/admin/catalog/:id/edit" element={<EditProductPage />} />
                <Route path="/admin/taxonomy"   element={<Navigate to="/admin/attributes" replace />} />
                <Route path="/admin/attributes" element={<AttributesPage />} />
                <Route path="/admin/price-lists" element={<PriceListsPage />} />
                <Route path="/admin/catalog/:productId/variants" element={<ProductVariantsPage />} />
                <Route path="/admin/promotions"  element={<PromotionsPage />} />
                <Route path="/admin/price-inquiry" element={<PriceInquiryPage />} />
                <Route path="/admin/scanner" element={<QRScannerPage />} />
                <Route path="/admin/barcodes" element={<BarcodeLabelsPage />} />
                <Route path="/admin/label-templates" element={<LabelTemplatesPage />} />
                <Route path="/admin/label-templates/:id/edit" element={<LabelTemplateEditorPage />} />
              </Route>

              <Route element={<RequirePermission action="read"   subject="Inventory" />}>
                <Route path="/admin/inventory"  element={<InventoryPage />} />
                <Route path="/admin/inventory/movements" element={<StockMovementsPage />} />
                <Route path="/admin/inventory/transfers" element={<TransfersPage />} />
                <Route path="/admin/inventory/reservations" element={<ReservationsPage />} />
              </Route>

              <Route element={<RequirePermission action="read"   subject="Purchasing" />}>
                <Route path="/admin/purchasing" element={<PurchasingPage />} />
                <Route path="/admin/purchasing/new" element={<NewPurchasePage />} />
                <Route path="/admin/purchasing/receipts" element={<GoodsReceiptsPage />} />
                <Route path="/admin/suppliers"  element={<SuppliersPage />} />
              </Route>

              <Route element={<RequirePermission action="read"   subject="Sales" />}>
                <Route path="/admin/sales"      element={<SalesPage />} />
                <Route path="/admin/sales/fulfillment" element={<SalesFulfillmentPage />} />
                <Route path="/admin/returns"    element={<ReturnsPage />} />
              </Route>

              <Route element={<RequirePermission action="read"   subject="Customers" />}>
                <Route path="/admin/customers"  element={<CustomersPage />} />
              </Route>

              <Route element={<RequirePermission action="read"   subject="Finance" />}>
                <Route path="/admin/finance/current-accounts" element={<CurrentAccountsPage />} />
                <Route path="/admin/finance/treasury"         element={<CashSessionsPage />} />
                <Route path="/admin/finance/payments"         element={<PaymentsPage />} />
                <Route path="/admin/finance/invoices"         element={<InvoicesPage />} />
              </Route>

              <Route element={<RequirePermission action="read"   subject="Reports" />}>
                <Route path="/admin/reports"      element={<ReportsPage />} />
                <Route path="/admin/audit"         element={<AuditPage />} />
                <Route path="/admin/sync"          element={<SyncStatusPage />} />
              </Route>

              <Route element={<RequirePermission action="manage" subject="Settings" />}>
                <Route path="/admin/settings"     element={<SettingsPage />} />
                <Route path="/admin/integrations" element={<IntegrationsPage />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
              </Route>

              <Route element={<RequirePermission action="manage" subject="Users" />}>
                <Route path="/admin/users"      element={<UsersPage />} />
              </Route>

              <Route element={<RequirePermission action="manage" subject="Settings" />}>
                <Route path="/admin/roles"      element={<RolesPage />} />
                <Route path="/admin/branches"   element={<BranchesPage />} />
                <Route path="/admin/cash-registers" element={<CashRegistersPage />} />
              </Route>

              <Route element={<RequirePermission action="manage" subject="Inventory" />}>
                <Route path="/admin/warehouses" element={<WarehousesPage />} />
                <Route path="/admin/locations"  element={<LocationsPage />} />
              </Route>
            </Route>

            {/* POS — full-screen, no sidebar */}
            <Route element={<RequirePermission action="create" subject="Sales" />}>
              <Route path="/pos" element={<POSPage />} />
            </Route>
          </Route>

          {/* ── Catch-all: redirect to / on storefront domain, /admin otherwise ── */}
          <Route path="*" element={
            isStorefrontDomain()
              ? <Navigate to="/" replace />
              : <Navigate to="/admin" replace />
          } />

        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
