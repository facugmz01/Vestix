"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const purchasing_controller_1 = require("./purchasing.controller");
const purchasing_service_1 = require("./purchasing.service");
const mockPurchasingService = {
    createPurchaseOrder: globals_1.jest.fn(),
    receiveGoods: globals_1.jest.fn(),
    findAllOrders: globals_1.jest.fn(),
    findOneOrder: globals_1.jest.fn(),
    findAllReceipts: globals_1.jest.fn(),
    findOneReceipt: globals_1.jest.fn(),
    prisma: {
        purchaseOrder: {
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
        },
    },
};
(0, globals_1.describe)('PurchasingController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [purchasing_controller_1.PurchasingController],
            providers: [{ provide: purchasing_service_1.PurchasingService, useValue: mockPurchasingService }],
        }).compile();
        controller = module.get(purchasing_controller_1.PurchasingController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('createPurchaseOrder', () => {
        (0, globals_1.it)('should delegate to purchasingService', () => {
            const dto = { supplierId: 's1', items: [] };
            mockPurchasingService.createPurchaseOrder.mockReturnValue({ id: 'po1' });
            const result = controller.createPurchaseOrder(dto);
            (0, globals_1.expect)(mockPurchasingService.createPurchaseOrder).toHaveBeenCalledWith(dto);
            (0, globals_1.expect)(result).toEqual({ id: 'po1' });
        });
    });
    (0, globals_1.describe)('findAllOrders', () => {
        (0, globals_1.it)('should delegate to purchasingService', () => {
            mockPurchasingService.findAllOrders.mockReturnValue([]);
            const result = controller.findAllOrders({});
            (0, globals_1.expect)(result).toEqual([]);
        });
    });
    (0, globals_1.describe)('findOneOrder', () => {
        (0, globals_1.it)('should delegate to purchasingService', () => {
            mockPurchasingService.findOneOrder.mockReturnValue({ id: 'po1' });
            const result = controller.findOneOrder('po1');
            (0, globals_1.expect)(mockPurchasingService.findOneOrder).toHaveBeenCalledWith('po1');
            (0, globals_1.expect)(result).toEqual({ id: 'po1' });
        });
    });
    (0, globals_1.describe)('issueOrder', () => {
        (0, globals_1.it)('should update order status to ISSUED via prisma', () => {
            mockPurchasingService.prisma.purchaseOrder.update.mockReturnValue({ id: 'po1', status: 'ISSUED' });
            const result = controller.issueOrder('po1');
            (0, globals_1.expect)(mockPurchasingService.prisma.purchaseOrder.update).toHaveBeenCalledWith({
                where: { id: 'po1' },
                data: { status: 'ISSUED' },
            });
            (0, globals_1.expect)(result).toEqual({ id: 'po1', status: 'ISSUED' });
        });
    });
    (0, globals_1.describe)('removeOrder', () => {
        (0, globals_1.it)('should delete via prisma', () => {
            mockPurchasingService.prisma.purchaseOrder.delete.mockReturnValue({ id: 'po1' });
            const result = controller.removeOrder('po1');
            (0, globals_1.expect)(mockPurchasingService.prisma.purchaseOrder.delete).toHaveBeenCalledWith({ where: { id: 'po1' } });
            (0, globals_1.expect)(result).toEqual({ id: 'po1' });
        });
    });
});
//# sourceMappingURL=purchasing.controller.spec.js.map