import { Injectable, Logger } from '@nestjs/common';
import {
  StockValuationReport,
  LowStockAlert,
} from './models/report.model';

const DEFAULT_REORDER_POINT = 5; // Alert when any SKU drops below 5 units in a branch

@Injectable()
export class StockReportService {
  private readonly logger = new Logger(StockReportService.name);

  /**
   * STOCK VALUATION REPORT
   * Answers the question: "What is the current value of our inventory?"
   * Calculated as: WAC (Weighted Average Cost) × availableQuantity per SKU.
   * Also calculates the potential retail value and margin gap.
   *
   * In production, this is an optimized materialized view query:
   *   SELECT
   *     sl.variant_id,
   *     sl.available_quantity,
   *     sl.reserved_quantity,
   *     pv.base_price AS retail_price,
   *     COALESCE(last_wac.unit_cost, 0) AS wac
   *   FROM stock_levels sl
   *   LEFT JOIN product_variants pv ON sl.variant_id = pv.id
   *   LEFT JOIN LATERAL (
   *     SELECT unit_cost FROM inventory_movements
   *     WHERE variant_id = sl.variant_id AND type = 'PURCHASE'
   *     ORDER BY created_at DESC LIMIT 1
   *   ) last_wac ON true
   */
  async getStockValuation(branchId?: string): Promise<StockValuationReport> {
    this.logger.log(`[StockReport] Valuation requested${branchId ? ` for branch ${branchId}` : ' (all branches)'}`);

    const mockLines = [
      { variantId: 'v1', sku: 'TSH-PRM-M-BLK', availableQty: 120, reservedQty: 5, unitCostWac: 9.50, unitRetailPrice: 20.00 },
      { variantId: 'v2', sku: 'JKT-WIN-L-NVY', availableQty: 42, reservedQty: 3, unitCostWac: 55.00, unitRetailPrice: 120.00 },
      { variantId: 'v3', sku: 'JNS-SKN-32-BLU', availableQty: 8,  reservedQty: 0, unitCostWac: 22.00, unitRetailPrice: 50.00 },
    ];

    const lines = mockLines.map(l => ({
      ...l,
      totalCostValue: parseFloat((l.availableQty * l.unitCostWac).toFixed(2)),
      totalRetailValue: parseFloat((l.availableQty * l.unitRetailPrice).toFixed(2)),
    }));

    const totalCost = lines.reduce((s, l) => s + l.totalCostValue, 0);
    const totalRetail = lines.reduce((s, l) => s + l.totalRetailValue, 0);

    return {
      generatedAt: new Date(),
      branchId,
      totalSKUs: lines.length,
      totalUnits: lines.reduce((s, l) => s + l.availableQty, 0),
      totalValueAtCost: parseFloat(totalCost.toFixed(2)),
      totalValueAtRetail: parseFloat(totalRetail.toFixed(2)),
      potentialMargin: parseFloat((((totalRetail - totalCost) / totalRetail) * 100).toFixed(2)),
      lines,
    };
  }

  /**
   * LOW STOCK ALERTS
   * Returns variants where availableQuantity has fallen below a configurable reorderPoint.
   * In production, this is checked by a scheduled cron job every hour, and 
   * wires into the Notifications module to email the store manager automatically.
   */
  async getLowStockAlerts(branchId?: string, reorderPoint = DEFAULT_REORDER_POINT): Promise<LowStockAlert[]> {
    // In production: WHERE available_quantity <= :reorderPoint AND branch_id = :branchId
    const mockAlerts: LowStockAlert[] = [
      { variantId: 'v3', sku: 'JNS-SKN-32-BLU', name: 'Skinny Jeans / 32 / Blue', branchId: branchId ?? 'branch-1', availableQuantity: 8, reorderPoint: 10 },
    ];

    return mockAlerts.filter(a => a.availableQuantity <= reorderPoint);
  }
}
