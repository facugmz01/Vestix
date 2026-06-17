"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const identity_controller_1 = require("./identity.controller");
describe('IdentityController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [identity_controller_1.IdentityController],
        }).compile();
        controller = module.get(identity_controller_1.IdentityController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=identity.controller.spec.js.map