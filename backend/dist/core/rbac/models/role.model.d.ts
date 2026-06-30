import { Permission } from './permission.model';
export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions?: Permission[];
    createdAt: Date;
    updatedAt: Date;
}
