"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const catalog_controller_1 = require("./catalog.controller");
const catalog_service_1 = require("./catalog.service");
const mockCatalogService = {
    createProduct: globals_1.jest.fn(),
    addVariantToProduct: globals_1.jest.fn(),
    addBarcodeToVariant: globals_1.jest.fn(),
    findAllForPos: globals_1.jest.fn(),
};
(0, globals_1.describe)('CatalogController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [catalog_controller_1.CatalogController],
            providers: [{ provide: catalog_service_1.CatalogService, useValue: mockCatalogService }],
        }).compile();
        controller = module.get(catalog_controller_1.CatalogController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('createProduct', () => {
        (0, globals_1.it)('should delegate to catalogService.createProduct', () => {
            const dto = { name: 'T-Shirt', categoryId: 'c1' };
            mockCatalogService.createProduct.mockReturnValue({ id: 'p1', ...dto });
            const result = controller.createProduct(dto);
            (0, globals_1.expect)(mockCatalogService.createProduct).toHaveBeenCalledWith(dto);
            (0, globals_1.expect)(result).toEqual({ id: 'p1', ...dto });
        });
    });
    (0, globals_1.describe)('addVariant', () => {
        (0, globals_1.it)('should delegate to catalogService.addVariantToProduct', () => {
            const dto = { sku: 'SKU-1', basePrice: 100 };
            mockCatalogService.addVariantToProduct.mockReturnValue({ id: 'v1' });
            const result = controller.addVariant('p1', dto);
            (0, globals_1.expect)(mockCatalogService.addVariantToProduct).toHaveBeenCalledWith('p1', dto);
            (0, globals_1.expect)(result).toEqual({ id: 'v1' });
        });
    });
    (0, globals_1.describe)('addBarcode', () => {
        (0, globals_1.it)('should delegate to catalogService.addBarcodeToVariant', () => {
            const dto = { barcode: '123456' };
            mockCatalogService.addBarcodeToVariant.mockReturnValue({ id: 'b1' });
            const result = controller.addBarcode('v1', dto);
            (0, globals_1.expect)(mockCatalogService.addBarcodeToVariant).toHaveBeenCalledWith('v1', dto);
            (0, globals_1.expect)(result).toEqual({ id: 'b1' });
        });
    });
    (0, globals_1.describe)('getPosSyncData', () => {
        (0, globals_1.it)('should delegate to catalogService.findAllForPos', () => {
            mockCatalogService.findAllForPos.mockReturnValue([]);
            const result = controller.getPosSyncData();
            (0, globals_1.expect)(mockCatalogService.findAllForPos).toHaveBeenCalled();
            (0, globals_1.expect)(result).toEqual([]);
        });
    });
});
//# sourceMappingURL=catalog.controller.spec.js.map