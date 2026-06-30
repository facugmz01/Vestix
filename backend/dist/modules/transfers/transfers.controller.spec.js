"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const transfers_controller_1 = require("./transfers.controller");
const transfers_service_1 = require("./transfers.service");
const mockTransfersService = {
    findAll: globals_1.jest.fn(),
    findOne: globals_1.jest.fn(),
    createTransfer: globals_1.jest.fn(),
    dispatchTransfer: globals_1.jest.fn(),
    receiveTransfer: globals_1.jest.fn(),
    prisma: {
        stockTransfer: {
            update: globals_1.jest.fn(),
        },
    },
};
(0, globals_1.describe)('TransfersController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [transfers_controller_1.TransfersController],
            providers: [{ provide: transfers_service_1.TransfersService, useValue: mockTransfersService }],
        }).compile();
        controller = module.get(transfers_controller_1.TransfersController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('findAll', () => {
        (0, globals_1.it)('should delegate to transfersService.findAll', () => {
            mockTransfersService.findAll.mockReturnValue([]);
            (0, globals_1.expect)(controller.findAll({})).toEqual([]);
        });
    });
    (0, globals_1.describe)('findOne', () => {
        (0, globals_1.it)('should delegate to transfersService.findOne', () => {
            mockTransfersService.findOne.mockReturnValue({ id: 't1' });
            (0, globals_1.expect)(controller.findOne('t1')).toEqual({ id: 't1' });
        });
    });
    (0, globals_1.describe)('createTransfer', () => {
        (0, globals_1.it)('should pass dto and user sub to service', () => {
            const dto = { originWarehouseId: 'w1', destinationWarehouseId: 'w2', items: [] };
            const req = { user: { sub: 'u1' } };
            mockTransfersService.createTransfer.mockReturnValue({ id: 't1' });
            const result = controller.createTransfer(dto, req);
            (0, globals_1.expect)(mockTransfersService.createTransfer).toHaveBeenCalledWith(dto, 'u1');
            (0, globals_1.expect)(result).toEqual({ id: 't1' });
        });
    });
    (0, globals_1.describe)('dispatchTransfer', () => {
        (0, globals_1.it)('should delegate to transfersService.dispatchTransfer', () => {
            mockTransfersService.dispatchTransfer.mockReturnValue({ id: 't1', status: 'IN_TRANSIT' });
            (0, globals_1.expect)(controller.dispatchTransfer('t1')).toEqual({ id: 't1', status: 'IN_TRANSIT' });
        });
    });
    (0, globals_1.describe)('cancelTransfer', () => {
        (0, globals_1.it)('should update status to CANCELLED via prisma', () => {
            mockTransfersService.prisma.stockTransfer.update.mockReturnValue({ id: 't1', status: 'CANCELLED' });
            const result = controller.cancelTransfer('t1');
            (0, globals_1.expect)(mockTransfersService.prisma.stockTransfer.update).toHaveBeenCalledWith({
                where: { id: 't1' },
                data: { status: 'CANCELLED' },
            });
            (0, globals_1.expect)(result).toEqual({ id: 't1', status: 'CANCELLED' });
        });
    });
});
//# sourceMappingURL=transfers.controller.spec.js.map