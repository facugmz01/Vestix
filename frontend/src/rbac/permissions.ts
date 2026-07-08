/**
 * Frontend RBAC permission model.
 * Mirrors the backend `{ action, subject }` pattern exactly.
 * Never duplicate business logic — only control what is *visible* in the UI.
 */

// ─── Actions (verbs) ─────────────────────────────────────────────────────────
export const Actions = {
  READ:   'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // Superpower: implies all actions on the subject
} as const;
export type Action = (typeof Actions)[keyof typeof Actions];

// ─── Subjects (domain resources) ─────────────────────────────────────────────
export const Subjects = {
  CATALOG:    'Catalog',
  INVENTORY:  'Inventory',
  PURCHASING: 'Purchasing',
  SALES:      'Sales',
  CUSTOMERS:  'Customers',
  SUPPLIERS:  'Suppliers',
  FINANCE:    'Finance',
  REPORTS:    'Reports',
  SETTINGS:   'Settings',
  SYNC:       'Sync',
  USERS:      'Users',
  LABELS:     'Labels',
  DELIVERY:   'Delivery',
  BRANCH:     'Branch',
  SYSTEM:     'System',
  PRICING:    'Pricing',
  ALL:        'all',
} as const;
export type Subject = (typeof Subjects)[keyof typeof Subjects];

// ─── Permission tuple ─────────────────────────────────────────────────────────
export interface PermissionTuple {
  action:  Action | string;
  subject: Subject | string;
}

// ─── System roles ─────────────────────────────────────────────────────────────
export const Roles = {
  SUPER_ADMIN:        'SUPER_ADMIN',
  STORE_MANAGER:      'STORE_MANAGER',
  CASHIER:            'CASHIER',
  WAREHOUSE_OPERATOR: 'WAREHOUSE_OPERATOR',
  ECOMMERCE_MANAGER:  'ECOMMERCE_MANAGER',
  DELIVERY_DRIVER:    'DELIVERY_DRIVER',
} as const;
export type Role = (typeof Roles)[keyof typeof Roles];

/**
 * Human-readable role labels for display in the UI.
 */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:        'Super Admin',
  STORE_MANAGER:      'Gerente de Tienda',
  CASHIER:            'Cajero',
  WAREHOUSE_OPERATOR: 'Operario de Depósito',
  ECOMMERCE_MANAGER:  'Gerente E-commerce',
  DELIVERY_DRIVER:    'Repartidor',
};

/**
 * Default permissions per role.
 * Used only for UI hints — backend is always the authoritative source.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<Role, PermissionTuple[]> = {
  SUPER_ADMIN: [{ action: Actions.MANAGE, subject: Subjects.ALL }],
  STORE_MANAGER: [
    { action: Actions.READ,   subject: Subjects.CATALOG    },
    { action: Actions.READ,   subject: Subjects.INVENTORY  },
    { action: Actions.MANAGE, subject: Subjects.SALES      },
    { action: Actions.MANAGE, subject: Subjects.CUSTOMERS  },
    { action: Actions.READ,   subject: Subjects.REPORTS    },
    { action: Actions.READ,   subject: Subjects.FINANCE    },
    { action: Actions.MANAGE, subject: Subjects.USERS      },
    { action: Actions.MANAGE, subject: Subjects.SETTINGS   },
    { action: Actions.MANAGE, subject: Subjects.BRANCH     },
    { action: Actions.READ,   subject: Subjects.SYSTEM     },
    { action: Actions.READ,   subject: Subjects.LABELS     },
    { action: 'print',        subject: Subjects.LABELS     },
    { action: Actions.MANAGE, subject: Subjects.LABELS     },
    { action: Actions.MANAGE, subject: Subjects.DELIVERY   },
  ],
  CASHIER: [
    { action: Actions.CREATE, subject: Subjects.SALES     },
    { action: Actions.READ,   subject: Subjects.CATALOG   },
    { action: Actions.CREATE, subject: Subjects.CUSTOMERS },
    { action: Actions.READ,   subject: Subjects.SYNC      },
    { action: Actions.READ,   subject: Subjects.LABELS    },
    { action: 'print',        subject: Subjects.LABELS    },
  ],
  WAREHOUSE_OPERATOR: [
    { action: Actions.READ,   subject: Subjects.INVENTORY  },
    { action: Actions.UPDATE, subject: Subjects.INVENTORY  },
    { action: Actions.READ,   subject: Subjects.PURCHASING },
    { action: Actions.UPDATE, subject: Subjects.PURCHASING },
    { action: Actions.READ,   subject: Subjects.LABELS     },
    { action: 'print',        subject: Subjects.LABELS     },
    { action: Actions.READ,   subject: Subjects.DELIVERY   },
    { action: Actions.UPDATE, subject: Subjects.DELIVERY   },
  ],
  ECOMMERCE_MANAGER: [
    { action: Actions.READ,   subject: Subjects.CATALOG   },
    { action: Actions.UPDATE, subject: Subjects.CATALOG   },
    { action: Actions.READ,   subject: Subjects.INVENTORY },
    { action: Actions.MANAGE, subject: Subjects.SALES     },
    { action: Actions.READ,   subject: Subjects.CUSTOMERS },
    { action: Actions.READ,   subject: Subjects.REPORTS   },
    { action: Actions.MANAGE, subject: Subjects.DELIVERY  },
  ],
  DELIVERY_DRIVER: [
    { action: Actions.READ,   subject: Subjects.DELIVERY  },
    { action: Actions.UPDATE, subject: Subjects.DELIVERY  },
  ],
};
