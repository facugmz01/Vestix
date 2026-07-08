import {
  Package, Layers, Tag,
  Warehouse, History, Truck,
  ShoppingCart, Users, FileText,
  Wallet, CreditCard, Banknote
} from 'lucide-react';
import type { TabItem } from '@/components/ui/Tabs';

export const CATALOG_TABS: TabItem[] = [
  { id: 'products', label: 'Productos', to: '/admin/catalog', icon: Package, end: true },
  { id: 'attributes', label: 'Categorías y Atributos', to: '/admin/attributes', icon: Layers },
  { id: 'promotions', label: 'Promociones', to: '/admin/promotions', icon: Tag },
  { id: 'prices', label: 'Listas de Precios', to: '/admin/price-lists', icon: Banknote },
  { id: 'price-inquiry', label: 'Consulta de Precios', to: '/admin/price-inquiry', icon: Tag },
  { id: 'barcodes', label: 'Etiquetas', to: '/admin/barcodes', icon: Tag },
  { id: 'label-templates', label: 'Plantillas', to: '/admin/label-templates', icon: Tag },
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
  { id: 'payments', label: 'Pagos y Cobros', to: '/admin/finance/payments', icon: CreditCard },
  { id: 'current-accounts', label: 'Cuentas Corrientes', to: '/admin/finance/current-accounts', icon: Banknote },
  { id: 'invoices', label: 'Facturación AFIP', to: '/admin/finance/invoices', icon: FileText },
];
