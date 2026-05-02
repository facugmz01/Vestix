export declare enum WarehouseType {
    STORE_FRONT = "STORE_FRONT",
    BACKROOM = "BACKROOM",
    DISTRIBUTION_CENTER = "DISTRIBUTION_CENTER",
    QUARANTINE = "QUARANTINE"
}
export interface Warehouse {
    id: string;
    branchId: string | null;
    name: string;
    code: string;
    type: WarehouseType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
