import { Permission } from './permission.model';

export interface Role {
  id: string;
  name: string; // e.g., 'Super Admin', 'Store Manager'
  description?: string;
  
  // A role can have many permissions (Many-to-Many relationship in DB)
  permissions?: Permission[]; 
  
  createdAt: Date;
  updatedAt: Date;
}
