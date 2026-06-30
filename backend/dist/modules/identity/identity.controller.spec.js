"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const identity_controller_1 = require("./identity.controller");
(0, globals_1.describe)('IdentityController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [identity_controller_1.IdentityController],
        }).compile();
        controller = module.get(identity_controller_1.IdentityController);
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
});
//# sourceMappingURL=identity.controller.spec.js.map