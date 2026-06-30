"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const locations_controller_1 = require("./locations.controller");
(0, globals_1.describe)('LocationsController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [locations_controller_1.LocationsController],
        }).compile();
        controller = module.get(locations_controller_1.LocationsController);
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
});
//# sourceMappingURL=locations.controller.spec.js.map