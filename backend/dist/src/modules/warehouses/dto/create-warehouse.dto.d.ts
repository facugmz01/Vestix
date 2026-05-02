import { WarehouseType } from '../models/warehouse.model';
export declare class CreateWarehouseDto {
    name: string;
    code: string;
    type: WarehouseType;
    branchId?: string;
    isActive?: boolean;
}
