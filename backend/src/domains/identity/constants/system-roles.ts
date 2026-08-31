/** Role names that are seeded by the system and cannot be deleted. */
export const SYSTEM_ROLE_NAMES = [
  'SUPER_ADMIN',
  'STORE_MANAGER',
  'CASHIER',
  'WAREHOUSE_OPERATOR',
  'ECOMMERCE_MANAGER',
  'DELIVERY_DRIVER',
  // Legacy names from older setup wizard
  'MANAGER',
  'WAREHOUSE',
  'VIEWER',
] as const;

export function isSystemRole(name: string): boolean {
  return (SYSTEM_ROLE_NAMES as readonly string[]).includes(name);
}

/** Default permissions per role — used during setup/bootstrap. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, { action: string; subject: string }[]> = {
  STORE_MANAGER: [
    { action: 'read', subject: 'Catalog' },
    { action: 'read', subject: 'Inventory' },
    { action: 'manage', subject: 'Sales' },
    { action: 'manage', subject: 'Customers' },
    { action: 'read', subject: 'Reports' },
    { action: 'read', subject: 'Finance' },
    { action: 'manage', subject: 'Users' },
    { action: 'manage', subject: 'Settings' },
    { action: 'manage', subject: 'Branch' },
    { action: 'read', subject: 'System' },
    { action: 'read', subject: 'Labels' },
    { action: 'print', subject: 'Labels' },
    { action: 'manage', subject: 'Labels' },
    { action: 'manage', subject: 'Delivery' },
    { action: 'apply', subject: 'Discount' },
    { action: 'override', subject: 'Price' },
  ],
  CASHIER: [
    { action: 'create', subject: 'Sales' },
    { action: 'read', subject: 'Catalog' },
    { action: 'create', subject: 'Customers' },
    { action: 'read', subject: 'Sync' },
    { action: 'read', subject: 'Labels' },
    { action: 'print', subject: 'Labels' },
    { action: 'read', subject: 'Finance' },
    { action: 'manage', subject: 'Finance' },
  ],
  WAREHOUSE_OPERATOR: [
    { action: 'read', subject: 'Inventory' },
    { action: 'update', subject: 'Inventory' },
    { action: 'read', subject: 'Purchasing' },
    { action: 'update', subject: 'Purchasing' },
    { action: 'read', subject: 'Labels' },
    { action: 'print', subject: 'Labels' },
    { action: 'read', subject: 'Delivery' },
    { action: 'update', subject: 'Delivery' },
  ],
  ECOMMERCE_MANAGER: [
    { action: 'read', subject: 'Catalog' },
    { action: 'update', subject: 'Catalog' },
    { action: 'read', subject: 'Inventory' },
    { action: 'manage', subject: 'Sales' },
    { action: 'read', subject: 'Customers' },
    { action: 'read', subject: 'Reports' },
    { action: 'manage', subject: 'Delivery' },
  ],
  DELIVERY_DRIVER: [
    { action: 'read', subject: 'Delivery' },
    { action: 'update', subject: 'Delivery' },
  ],
  VIEWER: [
    { action: 'read', subject: 'Catalog' },
    { action: 'read', subject: 'Inventory' },
    { action: 'read', subject: 'Reports' },
  ],
};
