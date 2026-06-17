"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const purchasing_controller_1 = require("./purchasing.controller");
describe('PurchasingController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [purchasing_controller_1.PurchasingController],
        }).compile();
        controller = module.get(purchasing_controller_1.PurchasingController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=purchasing.controller.spec.js.map