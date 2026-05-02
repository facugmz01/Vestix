import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  Truck, Users, CreditCard, BarChart2, Settings, Tag,
  Monitor, Globe, ChevronRight, History, Banknote, Wallet, FileText, Bell, Plug, Shield, RefreshCw, Layers
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Action, Subject } from '@/rbac/permissions';

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
 * Navigation grouped by module domain.
 * Each item declares the exact RBAC { action, subject } required to see it.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id:    'overview',
    label: 'General',
    items: [
      { id:'dashboard', label:'Dashboard',  to:'/admin',           icon:LayoutDashboard, action:'read',   subject:'Reports', end:true },
    ],
  },
  {
    id:    'commerce',
    label: 'Comercio',
    items: [
      { id:'catalog',   label:'Catálogo',           to:'/admin/catalog',     icon:Package, action:'read', subject:'Catalog' },
      { id:'attributes',label:'Categorías y Precios', to:'/admin/attributes',  icon:Layers,  action:'read', subject:'Catalog' },
      { id:'promotions',label:'Promociones',to:'/admin/promotions',icon:Package,         action:'read',   subject:'Catalog'    },
      { id:'inventory', label:'Inventario', to:'/admin/inventory', icon:Warehouse,       action:'read',   subject:'Inventory'  },
      { id:'movements', label:'Movimientos',to:'/admin/inventory/movements', icon:History,action:'read',  subject:'Inventory'  },
      { id:'transfers', label:'Transferencias',to:'/admin/inventory/transfers', icon:Truck,action:'read', subject:'Inventory'  },
      { id:'reservations', label:'Reservas de Stock',to:'/admin/inventory/reservations', icon:Package, action:'read', subject:'Inventory' },
      { id:'purchasing',label:'Compras (OC)',to:'/admin/purchasing',icon:ShoppingCart,     action:'read',   subject:'Purchasing' },
      { id:'receipts',  label:'Recepciones',to:'/admin/purchasing/receipts',icon:Package,  action:'read',   subject:'Purchasing' },
      { id:'suppliers', label:'Proveedores',to:'/admin/suppliers', icon:Users,           action:'read',   subject:'Purchasing' },
      { id:'pos',       label:'Punto de Venta',to:'/pos',            icon:Monitor,       action:'manage', subject:'Sales'      },
      { id:'sales',     label:'Ventas',     to:'/admin/sales',     icon:ShoppingCart,    action:'read',   subject:'Sales'      },
      { id:'returns',   label:'Devoluciones',to:'/admin/returns',  icon:History,         action:'read',   subject:'Sales'      },
      { id:'current-accounts', label:'Cuentas Ctes.',to:'/admin/finance/current-accounts', icon:Banknote, action:'read', subject:'Finance' },
      { id:'treasury',  label:'Cajas y Tesorería',to:'/admin/finance/treasury', icon:Wallet, action:'read', subject:'Finance' },
      { id:'payments',  label:'Pagos y Cobros',to:'/admin/finance/payments', icon:CreditCard, action:'read', subject:'Finance' },
      { id:'invoices',  label:'Facturación Electrónica',to:'/admin/finance/invoices', icon:FileText, action:'read', subject:'Finance' },
    ],
  },
  {
    id:    'crm',
    label: 'CRM',
    items: [
      { id:'customers', label:'Clientes',   to:'/admin/customers', icon:Users,           action:'read',   subject:'Customers'  },
    ],
  },
  {
    id:    'finance',
    label: 'Finanzas',
    items: [
      { id:'finance',   label:'Finanzas',   to:'/admin/finance',   icon:CreditCard,      action:'read',   subject:'Finance'    },
      { id:'reports',   label:'Reportes',   to:'/admin/reports',   icon:BarChart2,       action:'read',   subject:'Reports'    },
      { id:'notifications', label:'Notificaciones', to:'/admin/notifications', icon:Bell, action:'read', subject:'Reports'   },
      { id:'audit',     label:'Auditoría',   to:'/admin/audit',     icon:Shield,          action:'read',   subject:'Reports'    },
    ],
  },
  {
    id:    'channels',
    label: 'Canales',
    items: [
      { id:'pos',       label:'POS',        to:'/pos',             icon:Monitor,         action:'create', subject:'Sales'      },
      { id:'storefront',label:'Tienda',     to:'/store',           icon:Globe,           action:'read',   subject:'Catalog'    },
    ],
  },
  {
    id:    'system',
    label: 'Sistema',
    items: [
      { id:'branches',  label:'Sucursales', to:'/admin/branches',  icon:Warehouse,       action:'manage', subject:'Settings'   },
      { id:'cash-registers', label:'Cajas', to:'/admin/cash-registers', icon:Monitor,    action:'manage', subject:'Settings'   },
      { id:'warehouses',label:'Depósitos',  to:'/admin/warehouses',icon:Warehouse,       action:'manage', subject:'Inventory'  },
      { id:'locations', label:'Ubicaciones',to:'/admin/locations', icon:Warehouse,       action:'manage', subject:'Inventory'  },
      { id:'users',     label:'Usuarios',   to:'/admin/users',     icon:Users,           action:'manage', subject:'Users'      },
      { id:'roles',     label:'Roles',      to:'/admin/roles',     icon:Settings,        action:'manage', subject:'Settings'   },
      { id:'settings',  label:'Ajustes',       to:'/admin/settings',  icon:Settings,        action:'manage', subject:'Settings'   },
      { id:'integrations', label:'Integraciones', to:'/admin/integrations', icon:Plug,        action:'manage', subject:'Settings'   },
      { id:'sync',      label:'Sincronización', to:'/admin/sync',      icon:RefreshCw,       action:'read',   subject:'Reports'    },
    ],
  },
];

/** Flat list of all items (used for breadcrumb lookup). */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
