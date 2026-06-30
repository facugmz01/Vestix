"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const cash_report_service_1 = require("./cash-report.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mockPrismaService = {
    financialTransaction: { findMany: globals_1.jest.fn() },
};
(0, globals_1.describe)('CashReportService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                cash_report_service_1.CashReportService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(cash_report_service_1.CashReportService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('getCashSummary', () => {
        const from = new Date('2026-01-01');
        const to = new Date('2026-01-31');
        (0, globals_1.it)('should return zero totals when no transactions', async () => {
            mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([]);
            const result = await service.getCashSummary({ from, to });
            (0, globals_1.expect)(result.totalIncome).toBe(0);
            (0, globals_1.expect)(result.totalExpenses).toBe(0);
            (0, globals_1.expect)(result.netCash).toBe(0);
            (0, globals_1.expect)(result.byMethod).toEqual([]);
            (0, globals_1.expect)(result.dailySeries).toEqual([]);
        });
        (0, globals_1.it)('should correctly aggregate income and expenses', async () => {
            mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([
                { type: 'CREDIT', amount: 1000, createdAt: new Date('2026-01-15'), account: { type: 'CASH' } },
                { type: 'CREDIT', amount: 500, createdAt: new Date('2026-01-15'), account: { type: 'BANK' } },
                { type: 'DEBIT', amount: 300, createdAt: new Date('2026-01-15'), account: { type: 'CASH' } },
                { type: 'DEBIT', amount: 200, createdAt: new Date('2026-01-16'), account: { type: 'CASH' } },
            ]);
            const result = await service.getCashSummary({ from, to });
            (0, globals_1.expect)(result.totalIncome).toBe(1500);
            (0, globals_1.expect)(result.totalExpenses).toBe(500);
            (0, globals_1.expect)(result.netCash).toBe(1000);
            (0, globals_1.expect)(result.byMethod).toEqual(globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({ method: 'CASH', amount: 1000 }),
                globals_1.expect.objectContaining({ method: 'BANK', amount: 500 }),
            ]));
        });
        (0, globals_1.it)('should produce sorted daily series', async () => {
            mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([
                { type: 'CREDIT', amount: 100, createdAt: new Date('2026-01-20'), account: { type: 'CASH' } },
                { type: 'CREDIT', amount: 200, createdAt: new Date('2026-01-10'), account: { type: 'CASH' } },
            ]);
            const result = await service.getCashSummary({ from, to });
            (0, globals_1.expect)(result.dailySeries).toHaveLength(2);
            (0, globals_1.expect)(result.dailySeries[0].date).toBe('2026-01-10');
            (0, globals_1.expect)(result.dailySeries[1].date).toBe('2026-01-20');
        });
        (0, globals_1.it)('should apply branch filter when provided', async () => {
            mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([]);
            await service.getCashSummary({ from, to, branchId: 'b1' });
            (0, globals_1.expect)(mockPrismaService.financialTransaction.findMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                where: globals_1.expect.objectContaining({
                    account: { branchId: 'b1' },
                }),
            }));
        });
    });
});
//# sourceMappingURL=cash-report.service.spec.js.map