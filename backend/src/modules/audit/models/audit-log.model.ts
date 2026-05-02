export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPORT = 'EXPORT',
}

/**
 * Represents a single immutable audit event.
 * Once written, these records MUST never be modified or deleted.
 * In production, enforce this at the DB level via a revoke-UPDATE-DELETE policy on the table.
 */
export interface AuditLog {
  id: string;
  
  // WHO
  userId: string;         // The authenticated actor who performed the action
  userEmail?: string;     // Denormalized for legibility in audit reports (even if the user is later deleted)
  ipAddress?: string;     // Useful for detecting unauthorized access from unusual locations
  
  // WHAT
  action: AuditAction;
  resource: string;       // The domain entity (e.g., 'Customer', 'PurchaseOrder', 'InventoryMovement')
  resourceId?: string;    // The specific entity ID that was affected
  
  // CHANGE DIFF (Before/After snapshot for UPDATE events)
  previousValue?: Record<string, any>; // State before the operation
  newValue?: Record<string, any>;      // State after the operation
  
  // METADATA
  module: string;    // e.g., 'PricingService', 'SalesService'
  description?: string;
  
  createdAt: Date;   // Immutable timestamp
}
