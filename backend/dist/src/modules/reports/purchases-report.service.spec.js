"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const purchases_report_service_1 = require("./purchases-report.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mockPrismaService = {
    purchaseOrder: { findMany: globals_1.jest.fn() },
};
(0, globals_1.describe)('PurchasesReportService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                purchases_report_service_1.PurchasesReportService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(purchases_report_service_1.PurchasesReportService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('getPurchasesSummary', () => {
        const from = new Date('2026-01-01');
        const to = new Date('2026-01-31');
        (0, globals_1.it)('should return zero totals when no orders', async () => {
            mockPrismaService.purchaseOrder.findMany.mockResolvedValueOnce([]);
            const result = await service.getPurchasesSummary({ from, to });
            (0, globals_1.expect)(result.totalOrders).toBe(0);
            (0, globals_1.expect)(result.totalAmount).toBe(0);
            (0, globals_1.expect)(result.totalReceived).toBe(0);
            (0, globals_1.expect)(result.pendingAmount).toBe(0);
            (0, globals_1.expect)(result.topSuppliers).toEqual([]);
        });
        (0, globals_1.it)('should aggregate orders and track top suppliers', async () => {
            mockPrismaService.purchaseOrder.findMany.mockResolvedValueOnce([
                { totalAmount: 5000, paidAmount: 3000, supplier: { companyName: 'SupplierA' } },
                { totalAmount: 2000, paidAmount: 2000, supplier: { companyName: 'SupplierB' } },
                { totalAmount: 8000, paidAmount: 5000, supplier: { companyName: 'SupplierA' } },
            ]);
            const result = await service.getPurchasesSummary({ from, to });
            (0, globals_1.expect)(result.totalOrders).toBe(3);
            (0, globals_1.expect)(result.totalAmount).toBe(15000);
            (0, globals_1.expect)(result.totalReceived).toBe(10000);
            (0, globals_1.expect)(result.pendingAmount).toBe(5000);
            (0, globals_1.expect)(result.topSuppliers[0].supplierName).toBe('SupplierA');
            (0, globals_1.expect)(result.topSuppliers[0].totalAmount).toBe(13000);
            (0, globals_1.expect)(result.topSuppliers[1].supplierName).toBe('SupplierB');
        });
        (0, globals_1.it)('should limit top suppliers to 5', async () => {
            const orders = Array.from({ length: 10 }, (_, i) => ({
                totalAmount: 1000 * (i + 1),
                paidAmount: 500,
                supplier: { companyName: `Supplier${i}` },
            }));
            mockPrismaService.purchaseOrder.findMany.mockResolvedValueOnce(orders);
            const result = await service.getPurchasesSummary({ from, to });
            (0, globals_1.expect)(result.topSuppliers).toHaveLength(5);
            (0, globals_1.expect)(result.topSuppliers[0].totalAmount).toBeGreaterThan(result.topSuppliers[4].totalAmount);
        });
    });
});
//# sourceMappingURL=purchases-report.service.spec.js.map