"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const stock_report_service_1 = require("./stock-report.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mockPrismaService = {
    stockLevel: { findMany: globals_1.jest.fn() },
};
(0, globals_1.describe)('StockReportService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stock_report_service_1.StockReportService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(stock_report_service_1.StockReportService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('getStockValuation', () => {
        (0, globals_1.it)('should return correct valuation for stock levels', async () => {
            mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([
                {
                    variantId: 'v1',
                    availableQuantity: 10,
                    reservedQuantity: 2,
                    variant: { sku: 'SKU-1', costPrice: 50, basePrice: 100, product: { name: 'Shirt' } },
                },
                {
                    variantId: 'v2',
                    availableQuantity: 5,
                    reservedQuantity: 0,
                    variant: { sku: 'SKU-2', costPrice: 30, basePrice: 60, product: { name: 'Pants' } },
                },
            ]);
            const result = await service.getStockValuation();
            (0, globals_1.expect)(result.totalSKUs).toBe(2);
            (0, globals_1.expect)(result.totalUnits).toBe(15);
            (0, globals_1.expect)(result.totalValueAtCost).toBe(650);
            (0, globals_1.expect)(result.totalValueAtRetail).toBe(1300);
            (0, globals_1.expect)(result.potentialMargin).toBe(50);
            (0, globals_1.expect)(result.lines).toHaveLength(2);
        });
        (0, globals_1.it)('should return empty report when no stock', async () => {
            mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([]);
            const result = await service.getStockValuation();
            (0, globals_1.expect)(result.totalSKUs).toBe(0);
            (0, globals_1.expect)(result.totalUnits).toBe(0);
            (0, globals_1.expect)(result.totalValueAtCost).toBe(0);
            (0, globals_1.expect)(result.potentialMargin).toBe(0);
        });
        (0, globals_1.it)('should handle missing variant cost/price', async () => {
            mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([
                {
                    variantId: 'v1',
                    availableQuantity: 3,
                    reservedQuantity: 0,
                    variant: { sku: null, costPrice: null, basePrice: null, product: { name: 'Unknown' } },
                },
            ]);
            const result = await service.getStockValuation();
            (0, globals_1.expect)(result.totalValueAtCost).toBe(0);
            (0, globals_1.expect)(result.totalValueAtRetail).toBe(0);
            (0, globals_1.expect)(result.lines[0].sku).toBe('Unknown');
        });
        (0, globals_1.it)('should apply branch filter when branchId is provided', async () => {
            mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([]);
            await service.getStockValuation('b1');
            (0, globals_1.expect)(mockPrismaService.stockLevel.findMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                where: { warehouse: { branchId: 'b1' } },
            }));
        });
    });
    (0, globals_1.describe)('getLowStockAlerts', () => {
        (0, globals_1.it)('should return items below reorder point', async () => {
            mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([
                {
                    variantId: 'v1',
                    availableQuantity: 2,
                    variant: { sku: 'SKU-1', product: { name: 'Shirt' } },
                    warehouse: { branchId: 'b1' },
                },
            ]);
            const result = await service.getLowStockAlerts(undefined, 5);
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0].variantId).toBe('v1');
            (0, globals_1.expect)(result[0].availableQuantity).toBe(2);
            (0, globals_1.expect)(result[0].reorderPoint).toBe(5);
        });
        (0, globals_1.it)('should use default reorder point of 5', async () => {
            mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([]);
            await service.getLowStockAlerts();
            (0, globals_1.expect)(mockPrismaService.stockLevel.findMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                where: globals_1.expect.objectContaining({
                    availableQuantity: { lte: 5 },
                }),
            }));
        });
    });
});
//# sourceMappingURL=stock-report.service.spec.js.map