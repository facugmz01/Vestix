import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  SyncOperation,
  SyncOperationType,
  SyncStatus,
  ConflictStrategy,
  ConflictDetail,
} from './models/sync-operation.model';
import { SalesService } from './sales.service';
import { ReturnsService } from './returns/returns.service';
import { InventoryService } from '../logistics/inventory.service';
import { CashService } from '../finance/cash/cash.service';

@Injectable()
export class ConflictResolutionService {
  private readonly logger = new Logger(ConflictResolutionService.name);

  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Analyses a CHECKOUT operation for stock conflicts.
   * The core question: Did the server's stock move to 0 BEFORE the POS recorded this offline sale?
   */
  async detectCheckoutConflicts(op: SyncOperation): Promise<ConflictDetail[]> {
    const conflicts: ConflictDetail[] = [];

    for (const line of (op.payload.lines ?? [])) {
      const stockLevels = await this.inventoryService.getStockPerBranch(op.branchId, line.variantId);
      const serverAvailable = stockLevels.reduce((s: number, l: any) => s + l.availableQuantity, 0);

      if (serverAvailable < line.quantity) {
        conflicts.push({
          field: `stock.${line.variantId}`,
          clientValue: line.quantity,
          serverValue: serverAvailable,
          // Architecture decision: We DO apply the sale (never embarrass a customer)
          // but flag it as CONFLICT for manager review and potential supplier reorder.
          strategy: ConflictStrategy.CLIENT_WINS,
        });

        this.logger.warn(
          `[Conflict] Stock shortage on variantId=${line.variantId}. ` +
          `Client sold ${line.quantity}, server only has ${serverAvailable}. Applying CLIENT_WINS.`
        );
      }
    }

    return conflicts;
  }

  /**
   * Analyses a STOCK_COUNT operation.
   * If a physical count done offline says "50 units" but the server now expects "35 units" 
   * (because online sales happened while the device was offline), a manager must decide.
   */
  async detectStockCountConflicts(op: SyncOperation): Promise<ConflictDetail[]> {
    const conflicts: ConflictDetail[] = [];
    
    for (const countLine of (op.payload.counts ?? [])) {
      const stockLevels = await this.inventoryService.getStockPerBranch(op.branchId, countLine.variantId);
      const serverQty = stockLevels.reduce((s: number, l: any) => s + l.availableQuantity, 0);
      
      if (serverQty !== countLine.countedQuantity) {
        conflicts.push({
          field: `count.${countLine.variantId}`,
          clientValue: countLine.countedQuantity,
          serverValue: serverQty,
          // Physical counts require human judgment — difference could be legitimate sales OR theft
          strategy: ConflictStrategy.MANAGER_REVIEW,
        });
      }
    }

    return conflicts;
  }
}
