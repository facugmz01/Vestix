"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const purchasing_service_1 = require("./purchasing.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const common_1 = require("@nestjs/common");
const mockPrismaService = {
    $transaction: globals_1.jest.fn((callback) => callback(mockPrismaService)),
    purchaseOrder: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
    },
    goodsReceipt: {
        create: globals_1.jest.fn(),
    },
    pOLineItem: {
        update: globals_1.jest.fn(),
    },
};
const mockInventoryService = {
    recordMovement: globals_1.jest.fn(),
};
(0, globals_1.describe)('PurchasingService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                purchasing_service_1.PurchasingService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: inventory_service_1.InventoryService, useValue: mockInventoryService },
            ],
        }).compile();
        service = module.get(purchasing_service_1.PurchasingService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('receiveGoods', () => {
        (0, globals_1.it)('should throw if PO is already completed', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValueOnce({
                id: 'po1',
                status: 'COMPLETED',
            });
            await (0, globals_1.expect)(service.receiveGoods({ purchaseOrderId: 'po1', lines: [] })).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should receive goods and update inventory', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValueOnce({
                id: 'po1',
                status: 'ISSUED',
                destinationWarehouseId: 'w1',
                lines: [
                    { id: 'l1', variantId: 'v1', orderedQuantity: 10, receivedQuantity: 0, unitCost: 100 },
                ],
            });
            mockPrismaService.goodsReceipt.create.mockResolvedValueOnce({ id: 'receipt1' });
            await service.receiveGoods({
                purchaseOrderId: 'po1',
                lines: [{ variantId: 'v1', receivedQuantity: 5 }],
            });
            (0, globals_1.expect)(mockInventoryService.recordMovement).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                variantId: 'v1',
                quantity: 5,
                type: 'GOODS_RECEIPT',
                destinationWarehouseId: 'w1',
            }), mockPrismaService);
            (0, globals_1.expect)(mockPrismaService.purchaseOrder.update).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: { status: 'PARTIALLY_RECEIVED' },
            }));
        });
    });
});
//# sourceMappingURL=purchasing.service.spec.js.map