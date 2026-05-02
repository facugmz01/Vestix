import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchaseOrder, POStatus, POLineItem } from './models/purchase-order.model';
import { CreatePurchaseOrderDto } from './dto/purchasing.dto';
import { StockMovementService } from '../inventory/stock-movement.service';
import * as crypto from 'crypto';

@Injectable()
export class PurchasingService {
  constructor(private readonly stockMovementService: StockMovementService) {}

  private purchaseOrders: PurchaseOrder[] = [];

  async createPO(dto: CreatePurchaseOrderDto) {
    const lines: POLineItem[] = dto.lines.map(l => ({
      id: crypto.randomUUID(),
      variantId: l.variantId,
      orderedQuantity: l.orderedQuantity,
      receivedQuantity: 0,
      unitCost: l.unitCost,
    }));

    const totalCost = lines.reduce((sum, line) => sum + (line.orderedQuantity * line.unitCost), 0);

    const po: PurchaseOrder = {
      id: crypto.randomUUID(),
      supplierId: dto.supplierId,
      destinationWarehouseId: dto.destinationWarehouseId,
      status: POStatus.DRAFT,
      lines,
      totalCost,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.purchaseOrders.push(po);
    return po;
  }

  async issuePO(id: string) {
    const po = this.purchaseOrders.find(p => p.id === id);
    if (!po) throw new NotFoundException('PO not found');
    po.status = POStatus.ISSUED;
    return po;
  }

  // --- NEW EXPOSED METHODS FOR GOODS RECEIPT MODULE ---

  async getPO(id: string) {
    return this.purchaseOrders.find(p => p.id === id);
  }

  /**
   * Called automatically by the Goods Receipt service once the physical delivery is validated.
   * Modifies the PO status based on the aggregated received amounts.
   */
  async applyReceiptToPO(poId: string, receiptLines: { poLineItemId: string, receivedQuantity: number }[]) {
    const po = this.purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    for (const receipt of receiptLines) {
      const line = po.lines.find(l => l.id === receipt.poLineItemId);
      if (line) {
        line.receivedQuantity += receipt.receivedQuantity;
      }
    }

    const allFullyReceived = po.lines.every(l => l.receivedQuantity >= l.orderedQuantity);
    po.status = allFullyReceived ? POStatus.COMPLETED : POStatus.PARTIALLY_RECEIVED;
    if (allFullyReceived) po.completedAt = new Date();
    po.updatedAt = new Date();
  }
}
