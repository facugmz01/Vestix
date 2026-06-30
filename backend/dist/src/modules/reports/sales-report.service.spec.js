"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const sales_report_service_1 = require("./sales-report.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mockPrismaService = {
    saleOrder: { findMany: globals_1.jest.fn() },
    orderLineItem: { findMany: globals_1.jest.fn() },
    inventoryMovement: { findMany: globals_1.jest.fn() },
    warehouse: { findMany: globals_1.jest.fn() },
};
(0, globals_1.describe)('SalesReportService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                sales_report_service_1.SalesReportService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(sales_report_service_1.SalesReportService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('getSalesSummary', () => {
        const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };
        (0, globals_1.it)('should return zero totals when no orders exist', async () => {
            mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([]);
            const result = await service.getSalesSummary(filter);
            (0, globals_1.expect)(result.totalOrders).toBe(0);
            (0, globals_1.expect)(result.netRevenue).toBe(0);
            (0, globals_1.expect)(result.averageOrderValue).toBe(0);
            (0, globals_1.expect)(result.byPaymentMethod).toEqual([]);
        });
        (0, globals_1.it)('should aggregate orders with payments', async () => {
            mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
                {
                    subtotal: 1000, cartDiscountTotal: 100, grandTotal: 900, source: 'POS',
                    paymentMethod: null,
                    payments: [
                        { amount: 500, paymentMethod: { type: 'CASH' } },
                        { amount: 400, paymentMethod: { type: 'CARD' } },
                    ],
                },
                {
                    subtotal: 500, cartDiscountTotal: 0, grandTotal: 500, source: 'ECOMMERCE',
                    paymentMethod: 'TRANSFER',
                    payments: [],
                },
            ]);
            const result = await service.getSalesSummary(filter);
            (0, globals_1.expect)(result.totalOrders).toBe(2);
            (0, globals_1.expect)(result.totalRevenue).toBe(1500);
            (0, globals_1.expect)(result.totalDiscounts).toBe(100);
            (0, globals_1.expect)(result.netRevenue).toBe(1400);
            (0, globals_1.expect)(result.averageOrderValue).toBe(700);
            (0, globals_1.expect)(result.byPaymentMethod).toEqual(globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({ method: 'CASH', amount: 500 }),
                globals_1.expect.objectContaining({ method: 'CARD', amount: 400 }),
                globals_1.expect.objectContaining({ method: 'TRANSFER', amount: 500 }),
            ]));
            (0, globals_1.expect)(result.byChannel).toEqual({ POS: 900, ECOMMERCE: 500 });
        });
        (0, globals_1.it)('should use paymentMethod field when payments array is empty', async () => {
            mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
                {
                    subtotal: 200, cartDiscountTotal: 0, grandTotal: 200,
                    source: 'POS', paymentMethod: 'CASH', payments: [],
                },
            ]);
            const result = await service.getSalesSummary(filter);
            (0, globals_1.expect)(result.byPaymentMethod[0].method).toBe('CASH');
        });
    });
    (0, globals_1.describe)('getTopSellers', () => {
        const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };
        (0, globals_1.it)('should return empty array when no line items', async () => {
            mockPrismaService.orderLineItem.findMany.mockResolvedValueOnce([]);
            const result = await service.getTopSellers(filter);
            (0, globals_1.expect)(result).toEqual([]);
        });
        (0, globals_1.it)('should aggregate and sort by units sold', async () => {
            mockPrismaService.orderLineItem.findMany.mockResolvedValueOnce([
                { variantId: 'v1', quantity: 5, finalPrice: 500, variant: { sku: 'SKU-1', product: { name: 'Shirt' } } },
                { variantId: 'v1', quantity: 3, finalPrice: 300, variant: { sku: 'SKU-1', product: { name: 'Shirt' } } },
                { variantId: 'v2', quantity: 10, finalPrice: 1000, variant: { sku: 'SKU-2', product: { name: 'Pants' } } },
            ]);
            const result = await service.getTopSellers(filter, 2);
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0].variantId).toBe('v2');
            (0, globals_1.expect)(result[0].totalUnitsSold).toBe(10);
            (0, globals_1.expect)(result[1].variantId).toBe('v1');
            (0, globals_1.expect)(result[1].totalUnitsSold).toBe(8);
            (0, globals_1.expect)(result[1].totalRevenue).toBe(800);
        });
    });
    (0, globals_1.describe)('getCogsReport', () => {
        const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };
        (0, globals_1.it)('should calculate COGS, profit, and margin', async () => {
            mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([
                { quantity: 10, unitCost: 50 },
                { quantity: 5, unitCost: 30 },
            ]);
            mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
                { subtotal: 1000, cartDiscountTotal: 0, grandTotal: 1000, source: 'POS', payments: [], paymentMethod: 'CASH' },
            ]);
            const result = await service.getCogsReport(filter);
            (0, globals_1.expect)(result.totalCOGS).toBe(650);
            (0, globals_1.expect)(result.totalRevenue).toBe(1000);
            (0, globals_1.expect)(result.grossProfit).toBe(350);
            (0, globals_1.expect)(result.grossMarginPct).toBe(35);
        });
        (0, globals_1.it)('should return 0 margin when no revenue', async () => {
            mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([]);
            mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([]);
            const result = await service.getCogsReport(filter);
            (0, globals_1.expect)(result.grossMarginPct).toBe(0);
        });
        (0, globals_1.it)('should filter by branch warehouses when branchId is provided', async () => {
            mockPrismaService.warehouse.findMany.mockResolvedValueOnce([{ id: 'w1' }, { id: 'w2' }]);
            mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([]);
            mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([]);
            await service.getCogsReport({ ...filter, branchId: 'b1' });
            (0, globals_1.expect)(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith({
                where: { branchId: 'b1' },
                select: { id: true },
            });
        });
    });
});
//# sourceMappingURL=sales-report.service.spec.js.map