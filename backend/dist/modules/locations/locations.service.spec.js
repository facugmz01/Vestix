"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const locations_service_1 = require("./locations.service");
describe('LocationsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [locations_service_1.LocationsService],
        }).compile();
        service = module.get(locations_service_1.LocationsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=locations.service.spec.js.map