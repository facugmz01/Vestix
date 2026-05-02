import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { GoodsReceipt, ReceiptStatus, GoodsReceiptLine } from './models/goods-receipt.model';
import { PurchasingService } from '../purchasing.service';
import { StockMovementService } from '../../inventory/stock-movement.service';
import * as crypto from 'crypto';

@Injectable()
export class GoodsReceiptService {
  constructor(
    private readonly purchasingService: PurchasingService,
    private readonly stockMovementService: StockMovementService
  ) {}

  private receipts: GoodsReceipt[] = [];

  /**
   * 1. Draft a Goods Receipt based on what was physically scanned by the warehouse worker.
   */
  async draftReceipt(payload: {
    purchaseOrderId: string;
    receivedByUserId: string;
    scannedItems: { poLineItemId: string, variantId: string, quantity: number }[];
  }) {
    const po = await this.purchasingService.getPO(payload.purchaseOrderId);
    if (!po) throw new NotFoundException('Purchase Order not found');

    const lines: GoodsReceiptLine[] = [];
    let hasDifferences = false;

    for (const scan of payload.scannedItems) {
      const poLine = po.lines.find(l => l.id === scan.poLineItemId);
      if (!poLine) throw new BadRequestException(`Line item ${scan.poLineItemId} does not belong to PO ${po.id}`);

      // Calculate what we were expecting today (Ordered - Previously Received)
      const expected = poLine.orderedQuantity - poLine.receivedQuantity; 
      const difference = scan.quantity - expected;

      if (difference !== 0) {
        hasDifferences = true; // Flags the entire document as DISPUTED
      }

      lines.push({
        id: crypto.randomUUID(),
        poLineItemId: scan.poLineItemId,
        variantId: scan.variantId,
        expectedQuantity: expected,
        receivedQuantity: scan.quantity,
        difference,
        notes: difference > 0 ? 'Overshipment' : (difference < 0 ? 'Short shipment' : undefined),
      });
    }

    const receipt: GoodsReceipt = {
      id: crypto.randomUUID(),
      purchaseOrderId: po.id,
      destinationWarehouseId: po.destinationWarehouseId,
      receivedByUserId: payload.receivedByUserId,
      status: hasDifferences ? ReceiptStatus.DISPUTED : ReceiptStatus.DRAFT,
      lines,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.receipts.push(receipt);
    return receipt;
  }

  /**
   * 2. Validate and Commit the Receipt.
   * This pushes the physical goods into the Inventory Ledger and finalizes the financial cost.
   */
  async validateReceipt(receiptId: string, approvedByUserId?: string) {
    const receipt = this.receipts.find(r => r.id === receiptId);
    if (!receipt) throw new NotFoundException('Goods Receipt not found');

    if (receipt.status === ReceiptStatus.VALIDATED) {
      throw new ConflictException('This receipt has already been validated and posted to the ledger.');
    }

    // Strict Rule: If it's disputed (e.g., supplier sent 110 instead of 100), 
    // it requires an explicit manager override before the extra 10 enter our financial ledger.
    if (receipt.status === ReceiptStatus.DISPUTED && !approvedByUserId) {
      throw new BadRequestException('This receipt contains differences. A manager must explicitly approve the validation.');
    }

    const po = await this.purchasingService.getPO(receipt.purchaseOrderId);

    // Commit to double-entry ledger
    for (const line of receipt.lines) {
      const poLine = po.lines.find(l => l.id === line.poLineItemId)!;
      
      await this.stockMovementService.processGoodsReceipt({
        variantId: line.variantId,
        destinationWarehouseId: receipt.destinationWarehouseId,
        branchId: 'DERIVED-FROM-WAREHOUSE-ID', // Handled via DB joins in prod
        quantity: line.receivedQuantity,
        purchaseCost: poLine.unitCost, 
        purchaseOrderId: po.id,
      });
    }

    // Update the parent Purchase Order to reflect the new received quantities
    await this.purchasingService.applyReceiptToPO(receipt.purchaseOrderId, receipt.lines);

    receipt.status = ReceiptStatus.VALIDATED;
    receipt.updatedAt = new Date();
    
    return receipt;
  }
}
