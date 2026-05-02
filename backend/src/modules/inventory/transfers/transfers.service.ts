import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { StockTransfer, TransferStatus, TransferLine } from './models/transfer.model';
import { InventoryService } from '../inventory.service';
import { MovementType } from '../models/inventory-movement.model';
import * as crypto from 'crypto';

@Injectable()
export class TransfersService {
  constructor(private readonly inventoryLedger: InventoryService) {}

  private transfers: StockTransfer[] = [];

  /**
   * 1. CREATE: Drafts a transfer and validates physical feasibility.
   */
  async createTransfer(data: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    lines: TransferLine[];
  }) {
    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be distinct.');
    }

    // PRE-VALIDATION: Ensure source actually has the requested items before allowing a draft
    for (const line of data.lines) {
      const stockArr = await this.inventoryLedger.getStockPerWarehouse(data.sourceWarehouseId, line.variantId);
      const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
      
      if (available < line.quantity) {
         throw new BadRequestException(`Insufficient available stock for variant ${line.variantId} in the source warehouse.`);
      }
    }

    const transfer: StockTransfer = {
      id: crypto.randomUUID(),
      sourceWarehouseId: data.sourceWarehouseId,
      destinationWarehouseId: data.destinationWarehouseId,
      status: TransferStatus.DRAFT,
      lines: data.lines,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transfers.push(transfer);
    return transfer;
  }

  /**
   * 2. DISPATCH: The truck leaves. Goods are physically removed from the source building.
   */
  async dispatchTransfer(transferId: string, trackingNumber?: string) {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT transfers can be dispatched.');
    }

    // Execute TRANSFER_OUT movements against the ledger
    for (const line of transfer.lines) {
      // STRICT CONCURRENCY CHECK: Re-verify stock right before dispatch
      // (Someone might have bought the item at the POS while the transfer was sitting in DRAFT)
      const stockArr = await this.inventoryLedger.getStockPerWarehouse(transfer.sourceWarehouseId, line.variantId);
      const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
      
      if (available < line.quantity) {
        throw new BadRequestException(`Dispatch Failed: Stock for variant ${line.variantId} was consumed by a sale before dispatch.`);
      }

      await this.inventoryLedger.recordMovement({
        variantId: line.variantId,
        sourceWarehouseId: transfer.sourceWarehouseId,
        destinationWarehouseId: null, // Leaves physical source warehouse into Transit
        branchId: null, 
        type: MovementType.TRANSFER_OUT,
        quantity: line.quantity,
        referenceId: `TRF-${transfer.id}`,
      });
    }

    transfer.status = TransferStatus.IN_TRANSIT;
    transfer.trackingNumber = trackingNumber;
    transfer.dispatchedAt = new Date();
    transfer.updatedAt = new Date();

    return transfer;
  }

  /**
   * 3. RECEIVE: The truck arrives. Goods enter the destination building.
   */
  async receiveTransfer(transferId: string, destinationBranchId: string) {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('Only IN_TRANSIT transfers can be received.');
    }

    // Execute TRANSFER_IN movements against the ledger
    for (const line of transfer.lines) {
      await this.inventoryLedger.recordMovement({
        variantId: line.variantId,
        sourceWarehouseId: null, // Arriving from transit
        destinationWarehouseId: transfer.destinationWarehouseId,
        branchId: destinationBranchId,
        type: MovementType.TRANSFER_IN,
        quantity: line.quantity,
        referenceId: `TRF-${transfer.id}`,
      });
    }

    transfer.status = TransferStatus.COMPLETED;
    transfer.receivedAt = new Date();
    transfer.updatedAt = new Date();

    return transfer;
  }

  /**
   * 4. CANCEL: Aborts a request before it leaves the building.
   */
  async cancelTransfer(transferId: string) {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    
    // Strict Rule: If goods are IN_TRANSIT, they cannot be 'cancelled'.
    // A reverse transfer or manual shrinkage adjustment must be filed to maintain strict double-entry.
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Cannot cancel a transfer that is already dispatched. File a return or shrinkage instead.');
    }

    transfer.status = TransferStatus.CANCELLED;
    transfer.updatedAt = new Date();
    return transfer;
  }
}
