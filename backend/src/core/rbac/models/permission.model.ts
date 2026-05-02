export interface Permission {
  id: string;
  action: string; // e.g., 'create', 'read', 'update', 'delete', 'manage'
  subject: string; // e.g., 'User', 'Order', 'Inventory', 'all'
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
