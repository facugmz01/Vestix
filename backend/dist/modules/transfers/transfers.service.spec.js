"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const transfers_service_1 = require("./transfers.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const common_1 = require("@nestjs/common");
const mockPrismaService = {
    $transaction: globals_1.jest.fn((callback) => callback(mockPrismaService)),
    stockTransfer: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
    },
    stockTransferLine: {
        update: globals_1.jest.fn(),
    },
    productVariant: {
        findUnique: globals_1.jest.fn(),
    },
};
const mockInventoryService = {
    recordMovement: globals_1.jest.fn(),
};
(0, globals_1.describe)('TransfersService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                transfers_service_1.TransfersService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: inventory_service_1.InventoryService, useValue: mockInventoryService },
            ],
        }).compile();
        service = module.get(transfers_service_1.TransfersService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('dispatchTransfer', () => {
        (0, globals_1.it)('should throw if transfer is not DRAFT', async () => {
            mockPrismaService.stockTransfer.findUnique.mockResolvedValueOnce({ status: 'IN_TRANSIT' });
            await (0, globals_1.expect)(service.dispatchTransfer('t1')).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should deduct stock and mark IN_TRANSIT', async () => {
            mockPrismaService.stockTransfer.findUnique.mockResolvedValueOnce({
                id: 't1',
                status: 'DRAFT',
                sourceWarehouseId: 'w1',
                destinationWarehouseId: 'w2',
                lines: [{ id: 'l1', variantId: 'v1', quantity: 5 }],
            });
            mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({ costPrice: 50 });
            await service.dispatchTransfer('t1');
            (0, globals_1.expect)(mockInventoryService.recordMovement).toHaveBeenCalledWith(globals_1.expect.objectContaining({ type: 'TRANSFER_OUT', quantity: 5, sourceWarehouseId: 'w1' }), mockPrismaService);
        });
    });
    (0, globals_1.describe)('receiveTransfer', () => {
        (0, globals_1.it)('should add stock to destination', async () => {
            mockPrismaService.stockTransfer.findUnique.mockResolvedValueOnce({
                id: 't1',
                status: 'IN_TRANSIT',
                sourceWarehouseId: 'w1',
                destinationWarehouseId: 'w2',
                lines: [{ id: 'l1', variantId: 'v1', quantity: 5 }],
            });
            mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({ costPrice: 50 });
            await service.receiveTransfer('t1', {
                lines: [{ variantId: 'v1', receivedQuantity: 5 }],
            });
            (0, globals_1.expect)(mockInventoryService.recordMovement).toHaveBeenCalledWith(globals_1.expect.objectContaining({ type: 'TRANSFER_IN', quantity: 5, destinationWarehouseId: 'w2' }), mockPrismaService);
            (0, globals_1.expect)(mockPrismaService.stockTransferLine.update).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=transfers.service.spec.js.map