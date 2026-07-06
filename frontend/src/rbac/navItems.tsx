import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  Truck, Users, CreditCard, BarChart2,
  Settings, Monitor, Globe,
} from 'lucide-react';
import { usePermissions } from '@/rbac/usePermissions';
import type { Action, Subject } from '@/rbac/permissions';

export interface NavItem {
  id:      string;
  label:   string;
  to:      string;
  icon:    React.ReactNode;
  action:  Action | string;
  subject: Subject | string;
  end?:    boolean; // react-router end prop for exact match
  dividerBefore?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',  to: '/admin',            icon: <LayoutDashboard size={18} />, action: 'read',   subject: 'Reports',   end: true },
  { id: 'catalog',    label: 'Catálogo',   to: '/admin/catalog',    icon: <Package size={18} />,         action: 'read',   subject: 'Catalog'   },
  { id: 'inventory',  label: 'Inventario', to: '/admin/inventory',  icon: <Warehouse size={18} />,       action: 'read',   subject: 'Inventory' },
  { id: 'purchasing', label: 'Compras',    to: '/admin/purchasing', icon: <Truck size={18} />,           action: 'read',   subject: 'Purchasing'},
  { id: 'sales',      label: 'Ventas',     to: '/admin/sales',      icon: <ShoppingCart size={18} />,    action: 'read',   subject: 'Sales'     },
  { id: 'customers',  label: 'Clientes',   to: '/admin/customers',  icon: <Users size={18} />,           action: 'read',   subject: 'Customers' },
  { id: 'finance',    label: 'Finanzas',   to: '/admin/finance',    icon: <CreditCard size={18} />,      action: 'read',   subject: 'Finance',  dividerBefore: true },
  { id: 'reports',    label: 'Reportes',   to: '/admin/reports',    icon: <BarChart2 size={18} />,       action: 'read',   subject: 'Reports'   },
  { id: 'pos',        label: 'POS',        to: '/pos',              icon: <Monitor size={18} />,         action: 'create', subject: 'Sales',    dividerBefore: true },
  { id: 'catalog-pub',label: 'Tienda',     to: '/store',          icon: <Globe size={18} />,           action: 'read',   subject: 'Catalog'   },
  { id: 'settings',   label: 'Ajustes',    to: '/admin/settings',   icon: <Settings size={18} />,        action: 'manage', subject: 'Settings', dividerBefore: true },
];

/**
 * Returns only the nav items the current user is permitted to see.
 * Used by the Sidebar and any other navigation surfaces.
 */
export function useNavItems(): NavItem[] {
  const { can } = usePermissions();
  return NAV_ITEMS.filter((item) => can(item.action, item.subject));
}
