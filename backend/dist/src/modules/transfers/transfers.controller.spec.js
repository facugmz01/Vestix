"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const transfers_controller_1 = require("./transfers.controller");
describe('TransfersController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [transfers_controller_1.TransfersController],
        }).compile();
        controller = module.get(transfers_controller_1.TransfersController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=transfers.controller.spec.js.map