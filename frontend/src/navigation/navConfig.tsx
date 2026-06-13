import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  Users, Wallet, Settings, Monitor, Globe, BarChart2, Scan
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Action, Subject } from '@/rbac/permissions';

import {
  CATALOG_TABS,
  INVENTORY_TABS,
  PURCHASING_TABS,
  SALES_TABS,
  FINANCE_TABS,
} from './moduleTabs';

export interface NavItem {
  id:      string;
  label:   string;
  to:      string;
  icon:    LucideIcon;
  action:  Action | string;
  subject: Subject | string;
  end?:    boolean;
}

export interface NavGroup {
  id:    string;
  label: string;
  items: NavItem[];
}

/**
 * CONSOLIDATED NAVIGATION for the Sidebar.
 * Only the parent entry points are shown here.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id:    'overview',
    label: 'General',
    items: [
      { id:'dashboard', label:'Dashboard', to:'/admin', icon:LayoutDashboard, action:'read', subject:'Reports', end:true },
    ],
  },
  {
    id:    'commerce',
    label: 'Comercio',
    items: [
      { id:'catalog',   label:'Catálogo',     to:'/admin/catalog',    icon:Package,      action:'read', subject:'Catalog' },
      { id:'inventory', label:'Inventario',   to:'/admin/inventory',  icon:Warehouse,    action:'read', subject:'Inventory' },
      { id:'purchasing',label:'Compras',      to:'/admin/purchasing', icon:ShoppingCart, action:'read', subject:'Purchasing' },
      { id:'sales',     label:'Ventas',       to:'/admin/sales',      icon:ShoppingCart, action:'read', subject:'Sales' },
      { id:'scanner',   label:'Escáner QR',   to:'/admin/scanner',    icon:Scan,         action:'read', subject:'Catalog' },
    ],
  },
  {
    id:    'crm',
    label: 'CRM',
    items: [
      { id:'customers', label:'Clientes',     to:'/admin/customers',  icon:Users,        action:'read', subject:'Customers' },
    ],
  },
  {
    id:    'finance',
    label: 'Finanzas',
    items: [
      { id:'finance',   label:'Finanzas',     to:'/admin/finance/treasury', icon:Wallet,      action:'read', subject:'Finance' },
    ],
  },
  {
    id:    'reports',
    label: 'Reportes y Auditoría',
    items: [
      { id:'reports',   label:'Reportes',     to:'/admin/reports',    icon:BarChart2,    action:'read', subject:'Reports' },
    ],
  },
  {
    id:    'channels',
    label: 'Canales',
    items: [
      { id:'pos',       label:'Punto de Venta', to:'/pos',            icon:Monitor,      action:'manage', subject:'Sales' },
      { id:'storefront',label:'Tienda Web',     to:'/store',          icon:Globe,        action:'read',   subject:'Catalog' },
    ],
  },
  {
    id:    'system',
    label: 'Sistema',
    items: [
      { id:'settings',  label:'Configuración',to:'/admin/settings',   icon:Settings,     action:'manage', subject:'Settings' },
    ],
  },
];

/** 
 * Flat list of all items (used for breadcrumb lookup).
 * We manually combine NAV_GROUPS with all the Tab items so breadcrumbs can still find the hidden sub-routes.
 */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  // Add sub-routes for breadcrumbs:
  ...CATALOG_TABS.map(t => ({ ...t, action: 'read', subject: 'Catalog' } as NavItem)),
  ...INVENTORY_TABS.map(t => ({ ...t, action: 'read', subject: 'Inventory' } as NavItem)),
  ...PURCHASING_TABS.map(t => ({ ...t, action: 'read', subject: 'Purchasing' } as NavItem)),
  ...SALES_TABS.map(t => ({ ...t, action: 'read', subject: 'Sales' } as NavItem)),
  ...FINANCE_TABS.map(t => ({ ...t, action: 'read', subject: 'Finance' } as NavItem)),
];
