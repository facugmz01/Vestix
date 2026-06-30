"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const identity_service_1 = require("./identity.service");
describe('IdentityService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [identity_service_1.IdentityService],
        }).compile();
        service = module.get(identity_service_1.IdentityService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=identity.service.spec.js.map