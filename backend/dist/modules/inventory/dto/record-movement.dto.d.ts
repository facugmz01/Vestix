import { MovementType } from '../enums/movement-type.enum';
export declare class RecordMovementDto {
    variantId: string;
    quantity: number;
    type: MovementType;
    unitCost?: number;
    sourceWarehouseId?: string;
    destinationWarehouseId?: string;
    referenceId?: string;
    batchId?: string;
}
