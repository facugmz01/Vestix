"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const sales_controller_1 = require("./sales.controller");
describe('SalesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [sales_controller_1.SalesController],
        }).compile();
        controller = module.get(sales_controller_1.SalesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=sales.controller.spec.js.map