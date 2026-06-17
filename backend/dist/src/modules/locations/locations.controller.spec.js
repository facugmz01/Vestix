"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const locations_controller_1 = require("./locations.controller");
describe('LocationsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [locations_controller_1.LocationsController],
        }).compile();
        controller = module.get(locations_controller_1.LocationsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=locations.controller.spec.js.map