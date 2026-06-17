"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const treasury_service_1 = require("./treasury.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const common_1 = require("@nestjs/common");
const mockPrismaService = {
    $transaction: globals_1.jest.fn((callback) => callback(mockPrismaService)),
    cashShift: {
        findFirst: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
    },
};
(0, globals_1.describe)('TreasuryService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                treasury_service_1.TreasuryService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(treasury_service_1.TreasuryService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('openShift', () => {
        (0, globals_1.it)('should throw if user has open shift', async () => {
            mockPrismaService.cashShift.findFirst.mockResolvedValueOnce({ id: 's1', status: 'OPEN' });
            await (0, globals_1.expect)(service.openShift({ cashRegisterId: 'r1', openingAmount: 100 }, 'u1')).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should create an open shift', async () => {
            mockPrismaService.cashShift.findFirst.mockResolvedValue(null);
            mockPrismaService.cashShift.create.mockResolvedValueOnce({ id: 's1' });
            await service.openShift({ cashRegisterId: 'r1', openingAmount: 100 }, 'u1');
            (0, globals_1.expect)(mockPrismaService.cashShift.create).toHaveBeenCalledWith({
                data: {
                    cashRegisterId: 'r1',
                    openedByUserId: 'u1',
                    openingAmount: 100,
                    status: 'OPEN',
                },
            });
        });
    });
    (0, globals_1.describe)('closeShift', () => {
        (0, globals_1.it)('should calculate difference correctly', async () => {
            mockPrismaService.cashShift.findUnique.mockResolvedValueOnce({
                id: 's1',
                status: 'OPEN',
                openedByUserId: 'u1',
                openingAmount: 1000,
                sales: [
                    { paymentMethod: 'CASH', grandTotal: 500 },
                    { paymentMethod: 'CREDIT_CARD', grandTotal: 200 },
                ]
            });
            await service.closeShift({ shiftId: 's1', closingAmount: 1400 }, 'u1');
            (0, globals_1.expect)(mockPrismaService.cashShift.update).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: globals_1.expect.objectContaining({
                    status: 'CLOSED',
                    expectedAmount: 1500,
                    difference: -100,
                    closingAmount: 1400,
                })
            }));
        });
    });
});
//# sourceMappingURL=treasury.service.spec.js.map