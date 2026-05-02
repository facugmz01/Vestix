export interface Branch {
  id: string;
  name: string;
  code: string; // e.g., 'NYC-01', 'BA-CENTRAL'
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
