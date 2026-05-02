import { StockTransfer, TransferLine } from './models/transfer.model';
import { InventoryService } from '../inventory.service';
export declare class TransfersService {
    private readonly inventoryLedger;
    constructor(inventoryLedger: InventoryService);
    private transfers;
    createTransfer(data: {
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        lines: TransferLine[];
    }): Promise<StockTransfer>;
    dispatchTransfer(transferId: string, trackingNumber?: string): Promise<StockTransfer>;
    receiveTransfer(transferId: string, destinationBranchId: string): Promise<StockTransfer>;
    cancelTransfer(transferId: string): Promise<StockTransfer>;
}
