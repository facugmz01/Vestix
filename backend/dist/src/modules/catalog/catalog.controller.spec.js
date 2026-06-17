"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const catalog_controller_1 = require("./catalog.controller");
describe('CatalogController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [catalog_controller_1.CatalogController],
        }).compile();
        controller = module.get(catalog_controller_1.CatalogController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=catalog.controller.spec.js.map