import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Wallet,
  Settings,
  Monitor,
  Globe,
  BarChart3,
  Scan,
  BellRing,
  ShieldCheck,
  UserCog,
  DatabaseBackup,
  Truck,
  PlugZap,
  Gift,
  Star,
  Layers,
  FolderKanban,
  Percent,
  History,
  FileText,
  CreditCard,
  Banknote,
  Palette,
  Printer,
  LayoutTemplate,
  Search,
  Boxes,
  ArrowLeftRight,
  BookmarkCheck,
  Building2,
  Grid,
  ShoppingBag,
  ListOrdered,
  PackageCheck,
  Receipt,
  Undo2,
  Send,
  Navigation,
  BadgeDollarSign,
  ShieldAlert,
  RefreshCw,
  Store,
  Laptop,
  KeyRound,
  PlusCircle,
  List,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Action, Subject } from '@/rbac/permissions';

export interface NavSubItem {
  id: string;
  label: string;
  to: string;
  icon?: LucideIcon;
  action?: Action | string;
  subject?: Subject | string;
  end?: boolean;
  badge?: string | number;
}

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  action: Action | string;
  subject: Subject | string;
  end?: boolean;
  badge?: string | number;
  badgeVariant?: 'primary' | 'warning' | 'danger' | 'success';
  isQuickAction?: boolean;
  children?: NavSubItem[];
}

export interface NavSegment {
  id: string;
  label: string;
  items: NavItem[];
}

// Alias for backward compatibility
export type NavGroup = NavSegment;

/**
 * CLEAN MINIMALIST (Option 5) NAVIGATION TAXONOMY
 * Structured into 3 clear operational domains:
 * 1. General (Dashboard)
 * 2. Operaciones (Catálogo, Stock, Compras, Ventas & Logística, CRM)
 * 3. Administración & Canales (Finanzas, Reportes, Canales Online, Configuración)
 */
export const NAV_SEGMENTS: NavSegment[] = [
  // ── 1. GENERAL ─────────────────────────────────────────────────────────────
  {
    id: 'general',
    label: 'General',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        to: '/admin',
        icon: LayoutDashboard,
        action: 'read',
        subject: 'Reports',
        end: true,
      },
    ],
  },

  // ── 2. OPERACIONES ─────────────────────────────────────────────────────────
  {
    id: 'operations',
    label: 'Operaciones',
    items: [
      {
        id: 'catalog',
        label: 'Catálogo',
        to: '/admin/catalog',
        icon: Package,
        action: 'read',
        subject: 'Catalog',
        children: [
          { id: 'cat-products', label: 'Productos & Prendas', to: '/admin/catalog', icon: List, end: true },
          { id: 'cat-new-product', label: 'Nuevo Producto', to: '/admin/catalog/new', icon: PlusCircle },
          { id: 'cat-attributes', label: 'Categorías y Talles', to: '/admin/attributes', icon: Layers },
          { id: 'cat-collections', label: 'Colecciones', to: '/admin/collections', icon: FolderKanban },
          { id: 'cat-price-lists', label: 'Listas de Precios', to: '/admin/price-lists', icon: Banknote },
          { id: 'cat-promotions', label: 'Promociones (2x1)', to: '/admin/promotions', icon: Percent },
          { id: 'cat-price-inquiry', label: 'Consulta de Precios', to: '/admin/price-inquiry', icon: Search },
          { id: 'cat-barcodes', label: 'Impresión Etiquetas', to: '/admin/barcodes', icon: Printer },
          { id: 'cat-label-templates', label: 'Plantillas Etiquetas', to: '/admin/label-templates', icon: LayoutTemplate },
          { id: 'cat-scanner', label: 'Escáner QR', to: '/admin/scanner', icon: Scan },
        ],
      },
      {
        id: 'inventory',
        label: 'Inventario & Stock',
        to: '/admin/inventory',
        icon: Warehouse,
        action: 'read',
        subject: 'Inventory',
        children: [
          { id: 'inv-stock', label: 'Stock Actual', to: '/admin/inventory', icon: Boxes, end: true },
          { id: 'inv-movements', label: 'Movimientos', to: '/admin/inventory/movements', icon: History },
          { id: 'inv-transfers', label: 'Transferencias', to: '/admin/inventory/transfers', icon: ArrowLeftRight },
          { id: 'inv-reservations', label: 'Reservas', to: '/admin/inventory/reservations', icon: BookmarkCheck },
          { id: 'inv-warehouses', label: 'Depósitos', to: '/admin/warehouses', icon: Building2, action: 'manage', subject: 'Inventory' },
          { id: 'inv-locations', label: 'Ubicaciones y Racks', to: '/admin/locations', icon: Grid, action: 'manage', subject: 'Inventory' },
        ],
      },
      {
        id: 'purchasing',
        label: 'Compras & Proveedores',
        to: '/admin/purchasing',
        icon: ShoppingBag,
        action: 'read',
        subject: 'Purchasing',
        children: [
          { id: 'pur-orders', label: 'Órdenes de Compra', to: '/admin/purchasing', icon: ListOrdered, end: true },
          { id: 'pur-new', label: 'Nueva Compra', to: '/admin/purchasing/new', icon: PlusCircle },
          { id: 'pur-receipts', label: 'Recepciones', to: '/admin/purchasing/receipts', icon: PackageCheck },
          { id: 'pur-suppliers', label: 'Proveedores', to: '/admin/suppliers', icon: Users },
        ],
      },
      {
        id: 'sales',
        label: 'Ventas & Despachos',
        to: '/admin/sales',
        icon: ShoppingCart,
        action: 'read',
        subject: 'Sales',
        children: [
          { id: 'sales-history', label: 'Historial de Ventas', to: '/admin/sales', icon: Receipt, end: true },
          { id: 'sales-returns', label: 'Devoluciones', to: '/admin/returns', icon: Undo2 },
          { id: 'sales-delivery', label: 'Despachos y Envíos', to: '/admin/delivery', icon: Send, action: 'read', subject: 'Delivery' },
          { id: 'sales-carriers', label: 'Carriers y Tarifas', to: '/admin/delivery/carriers', icon: Navigation, action: 'read', subject: 'Delivery' },
        ],
      },
      {
        id: 'crm',
        label: 'Clientes & Fidelidad',
        to: '/admin/customers',
        icon: Users,
        action: 'read',
        subject: 'Customers',
        children: [
          { id: 'crm-customers', label: 'Directorio Clientes', to: '/admin/customers', icon: Users, end: true },
          { id: 'crm-loyalty', label: 'Club Fidelización', to: '/admin/loyalty', icon: Star, action: 'read', subject: 'Sales' },
          { id: 'crm-giftcards', label: 'Gift Cards y Vales', to: '/admin/gift-cards', icon: Gift, action: 'read', subject: 'Sales' },
          { id: 'crm-giftcard-templates', label: 'Plantillas Gift Cards', to: '/admin/gift-cards/template', icon: Palette, action: 'read', subject: 'Sales' },
        ],
      },
    ],
  },

  // ── 3. ADMINISTRACIÓN & CANALES ─────────────────────────────────────────────
  {
    id: 'administration',
    label: 'Administración',
    items: [
      {
        id: 'finance',
        label: 'Finanzas & AFIP',
        to: '/admin/finance/treasury',
        icon: Wallet,
        action: 'read',
        subject: 'Finance',
        children: [
          { id: 'fin-treasury', label: 'Cajas y Tesorería', to: '/admin/finance/treasury', icon: Wallet, end: true },
          { id: 'fin-payments', label: 'Cobros y Pagos', to: '/admin/finance/payments', icon: CreditCard },
          { id: 'fin-current-accounts', label: 'Cuentas Corrientes', to: '/admin/finance/current-accounts', icon: BadgeDollarSign },
          { id: 'fin-invoices', label: 'Facturación AFIP', to: '/admin/finance/invoices', icon: FileText },
        ],
      },
      {
        id: 'reports',
        label: 'Reportes & Auditoría',
        to: '/admin/reports',
        icon: BarChart3,
        action: 'read',
        subject: 'Reports',
        children: [
          { id: 'rep-analytics', label: 'Métricas y Reportes', to: '/admin/reports', icon: BarChart3, end: true },
          { id: 'rep-audit', label: 'Logs de Auditoría', to: '/admin/audit', icon: ShieldAlert },
          { id: 'rep-sync', label: 'Sincronización', to: '/admin/sync', icon: RefreshCw },
        ],
      },
      {
        id: 'channels',
        label: 'Canales Online',
        to: '/store',
        icon: Globe,
        action: 'read',
        subject: 'Catalog',
        children: [
          { id: 'ch-storefront', label: 'Ver Tienda Web', to: '/store', icon: Globe },
        ],
      },
      {
        id: 'settings',
        label: 'Configuración',
        to: '/admin/settings',
        icon: Settings,
        action: 'manage',
        subject: 'Settings',
        children: [
          { id: 'set-general', label: 'Ajustes Generales', to: '/admin/settings', icon: Settings, end: true },
          { id: 'set-branches', label: 'Sucursales', to: '/admin/branches', icon: Store },
          { id: 'set-registers', label: 'Cajas Registradoras', to: '/admin/cash-registers', icon: Laptop },
          { id: 'set-users', label: 'Usuarios del Sistema', to: '/admin/users', icon: UserCog, action: 'manage', subject: 'Users' },
          { id: 'set-roles', label: 'Roles y Permisos', to: '/admin/roles', icon: KeyRound },
          { id: 'set-integrations', label: 'Integraciones', to: '/admin/integrations', icon: PlugZap },
          { id: 'set-notifications', label: 'Notificaciones', to: '/admin/notifications', icon: BellRing },
          { id: 'set-backups', label: 'Respaldos', to: '/admin/backups', icon: DatabaseBackup, action: 'read', subject: 'Backups' },
        ],
      },
    ],
  },
];

// Compatibility export
export const NAV_GROUPS: NavGroup[] = NAV_SEGMENTS;

/**
 * Flat list of all top-level items and children (used for breadcrumbs and quick lookup).
 */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_SEGMENTS.flatMap((segment) => segment.items),
  ...NAV_SEGMENTS.flatMap((segment) =>
    segment.items.flatMap((item) =>
      (item.children || []).map((child) => ({
        id: child.id,
        label: child.label,
        to: child.to,
        icon: child.icon || item.icon,
        action: child.action || item.action,
        subject: child.subject || item.subject,
        end: child.end,
      }))
    )
  ),
  // Direct POS route
  {
    id: 'pos-direct',
    label: 'Punto de Venta (POS)',
    to: '/pos',
    icon: Monitor,
    action: 'create',
    subject: 'Sales',
  },
];
