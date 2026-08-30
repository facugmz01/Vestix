import {
  Package, Layers, FolderKanban, Percent,
  Warehouse, History, Truck,
  ShoppingCart, Users, FileText,
  Wallet, CreditCard, Banknote, Gift, Palette, Printer, LayoutTemplate, Search, Receipt,
} from 'lucide-react';
import type { TabItem } from '@/components/ui/Tabs';

/**
 * Catalog module nav — 4 top-level groups instead of 8 flat tabs.
 * Children appear in a dropdown and as a secondary pill row when active.
 */
export const CATALOG_TABS: TabItem[] = [
  { id: 'products', label: 'Productos', to: '/admin/catalog', icon: Package, end: true },
  {
    id: 'organization',
    label: 'Organización',
    to: '/admin/attributes',
    icon: FolderKanban,
    children: [
      { id: 'attributes', label: 'Categorías y Atributos', to: '/admin/attributes', icon: Layers },
      { id: 'collections', label: 'Colecciones', to: '/admin/collections', icon: Layers },
    ],
  },
  {
    id: 'pricing',
    label: 'Precios',
    to: '/admin/price-lists',
    icon: Banknote,
    children: [
      { id: 'prices', label: 'Listas de Precios', to: '/admin/price-lists', icon: Banknote },
      { id: 'price-inquiry', label: 'Consulta de Precios', to: '/admin/price-inquiry', icon: Search },
      { id: 'promotions', label: 'Promociones', to: '/admin/promotions', icon: Percent },
    ],
  },
  {
    id: 'labels',
    label: 'Etiquetas',
    to: '/admin/barcodes',
    icon: Printer,
    children: [
      { id: 'barcodes', label: 'Impresión', to: '/admin/barcodes', icon: Printer },
      { id: 'label-templates', label: 'Plantillas', to: '/admin/label-templates', icon: LayoutTemplate },
    ],
  },
];

export const INVENTORY_TABS: TabItem[] = [
  { id: 'stock', label: 'Stock Actual', to: '/admin/inventory', icon: Warehouse, end: true },
  { id: 'movements', label: 'Movimientos', to: '/admin/inventory/movements', icon: History },
  { id: 'transfers', label: 'Transferencias', to: '/admin/inventory/transfers', icon: Truck },
  { id: 'reservations', label: 'Reservas', to: '/admin/inventory/reservations', icon: Package },
];

export const PURCHASING_TABS: TabItem[] = [
  { id: 'orders', label: 'Órdenes de Compra', to: '/admin/purchasing', icon: ShoppingCart, end: true },
  { id: 'receipts', label: 'Recepciones', to: '/admin/purchasing/receipts', icon: Package },
  { id: 'suppliers', label: 'Proveedores', to: '/admin/suppliers', icon: Users },
];

export const DELIVERY_TABS: TabItem[] = [
  { id: 'shipments', label: 'Envíos', to: '/admin/delivery', icon: Package, end: true },
  { id: 'carriers', label: 'Carriers', to: '/admin/delivery/carriers', icon: Truck },
];

export const SALES_TABS: TabItem[] = [
  { id: 'history', label: 'Historial de Ventas', to: '/admin/sales', icon: ShoppingCart, end: true },
  { id: 'returns', label: 'Devoluciones', to: '/admin/returns', icon: History },
];

export const FINANCE_TABS: TabItem[] = [
  { id: 'treasury', label: 'Cajas y Tesorería', to: '/admin/finance/treasury', icon: Wallet },
  { id: 'expenses', label: 'Gastos Operativos', to: '/admin/finance/expenses', icon: Receipt },
  { id: 'payments', label: 'Pagos y Cobros', to: '/admin/finance/payments', icon: CreditCard },
  { id: 'current-accounts', label: 'Cuentas Corrientes', to: '/admin/finance/current-accounts', icon: Banknote },
  { id: 'invoices', label: 'Facturación AFIP', to: '/admin/finance/invoices', icon: FileText },
];

export const CRM_TABS: TabItem[] = [
  { id: 'gift-cards', label: 'Tarjetas', to: '/admin/gift-cards', icon: Gift, end: true },
  { id: 'gift-card-template', label: 'Plantilla', to: '/admin/gift-cards/template', icon: Palette },
];
