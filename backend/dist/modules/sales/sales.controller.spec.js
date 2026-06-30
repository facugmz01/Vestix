"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const sales_controller_1 = require("./sales.controller");
const sales_service_1 = require("./sales.service");
const mockSalesService = {
    createSale: globals_1.jest.fn(),
};
(0, globals_1.describe)('SalesController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [sales_controller_1.SalesController],
            providers: [{ provide: sales_service_1.SalesService, useValue: mockSalesService }],
        }).compile();
        controller = module.get(sales_controller_1.SalesController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('createSale', () => {
        (0, globals_1.it)('should return SUCCESS status with the order', async () => {
            const order = { id: 'o1', grandTotal: 500 };
            mockSalesService.createSale.mockResolvedValueOnce(order);
            const result = await controller.createSale({ items: [] });
            (0, globals_1.expect)(result).toEqual({ status: 'SUCCESS', order });
        });
    });
});
//# sourceMappingURL=sales.controller.spec.js.map