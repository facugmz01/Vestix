import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SaleReturn, ReturnAction, ReturnCondition } from './models/return.model';
import { StockMovementService } from '../../inventory/stock-movement.service';
import { AccountsService } from '../../finance/accounts.service';
import { CustomersService } from '../../customers/customers.service';
import { MovementType } from '../../inventory/models/inventory-movement.model';
import * as crypto from 'crypto';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly stockService: StockMovementService,
    private readonly accountsService: AccountsService,
    private readonly customersService: CustomersService,
  ) {}

  private returns: SaleReturn[] = [];

  /**
   * The Master Return Orchestrator.
   * Handles multi-module side effects: Inventory Restoration, Exchanges, and Treasury depletion.
   */
  async processReturn(payload: {
    originalOrderId: string;
    branchId: string;
    warehouseId: string;
    customerId?: string;
    refundAccountId?: string; // Required if giving cash/card refund
    lines: {
      originalOrderLineId: string;
      variantId: string;
      quantity: number;
      condition: ReturnCondition;
      action: ReturnAction;
      refundAmount: number;
      exchangeVariantId?: string;
    }[];
  }) {
    // 1. VALIDATION
    // In production, we fetch `SalesService.getOrder()` to ensure the customer isn't 
    // returning 5 shirts when they only bought 2.
    
    let totalRefund = 0;
    const returnLines = [];

    for (const line of payload.lines) {
      if (line.quantity <= 0) throw new BadRequestException('Return quantity must be positive.');
      
      totalRefund += line.refundAmount;
      returnLines.push({ id: crypto.randomUUID(), ...line });

      // 2. INVENTORY RESTORATION
      if (line.condition === ReturnCondition.SELLABLE) {
        // Perfect condition: Injects stock back into the local warehouse
        await this.stockService['inventoryLedger'].recordMovement({
          variantId: line.variantId,
          sourceWarehouseId: null, // Originates from the Customer
          destinationWarehouseId: payload.warehouseId,
          branchId: payload.branchId,
          type: MovementType.RETURN,
          quantity: line.quantity,
          referenceId: `RET-${payload.originalOrderId}`
        });
      } else if (line.condition === ReturnCondition.DAMAGED) {
        // Damaged: We accept the financial return, but it bypasses the physical shelf 
        // and goes straight to the waste/shrinkage ledger.
        await this.stockService['inventoryLedger'].recordMovement({
           variantId: line.variantId,
           sourceWarehouseId: payload.warehouseId, // Enters building...
           destinationWarehouseId: null,           // ...and immediately leaves to the trash
           branchId: payload.branchId,
           type: MovementType.SHRINKAGE,
           quantity: line.quantity,
           referenceId: `RET-DAMAGED-${payload.originalOrderId}`
        });
      }

      // 3. EXCHANGES (The "New Sale" half)
      if (line.action === ReturnAction.EXCHANGE) {
        if (!line.exchangeVariantId) throw new BadRequestException('Exchange requires a target Variant ID.');
        
        // Immediately decrement the *new* item from the physical shelf
        await this.stockService.processSaleExit({
          variantId: line.exchangeVariantId,
          sourceWarehouseId: payload.warehouseId,
          branchId: payload.branchId,
          quantity: line.quantity,
          orderId: `EXC-${payload.originalOrderId}`,
          wasReserved: false
        });
      }
    }

    // 4. FINANCIAL GATEWAY (The Refund)
    if (totalRefund > 0) {
      const isStoreCredit = payload.lines.some(l => l.action === ReturnAction.STORE_CREDIT);

      if (isStoreCredit) {
        if (!payload.customerId) throw new BadRequestException('Store credit requires a registered Customer Profile.');
        
        // Hits CRM: "Repay" their credit line (effectively adding money to their B2B balance)
        await this.customersService.repayCredit(payload.customerId, totalRefund, `CREDIT-${payload.originalOrderId}`);
      
      } else {
        if (!payload.refundAccountId) throw new BadRequestException('Treasury Account ID required for cash/card refunds.');
        
        // Hits Treasury: Physically removes cash from the register to hand back to the customer
        await this.accountsService.processOutgoingPayment({
          accountId: payload.refundAccountId,
          amount: totalRefund,
          payeeName: payload.customerId || 'Walk-in Customer',
          referenceId: `REF-${payload.originalOrderId}`,
          description: `Refund for Order ${payload.originalOrderId}`
        });
      }
    }

    // 5. FINALIZE DOCUMENT
    const saleReturn: SaleReturn = {
      id: crypto.randomUUID(),
      originalOrderId: payload.originalOrderId,
      branchId: payload.branchId,
      warehouseId: payload.warehouseId,
      customerId: payload.customerId,
      lines: returnLines,
      totalRefundAmount: totalRefund,
      refundAccountId: payload.refundAccountId,
      createdAt: new Date(),
    };

    this.returns.push(saleReturn);
    return saleReturn;
  }
}
