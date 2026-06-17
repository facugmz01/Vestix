"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const treasury_controller_1 = require("./treasury.controller");
describe('TreasuryController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [treasury_controller_1.TreasuryController],
        }).compile();
        controller = module.get(treasury_controller_1.TreasuryController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=treasury.controller.spec.js.map