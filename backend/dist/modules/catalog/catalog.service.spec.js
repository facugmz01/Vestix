"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const catalog_service_1 = require("./catalog.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const common_1 = require("@nestjs/common");
const mockPrismaService = {
    product: {
        create: globals_1.jest.fn(),
    },
    productVariant: {
        create: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
    },
    productBarcode: {
        create: globals_1.jest.fn(),
    },
};
(0, globals_1.describe)('CatalogService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                catalog_service_1.CatalogService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(catalog_service_1.CatalogService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('createProduct', () => {
        (0, globals_1.it)('should throw ConflictException on P2002 error', async () => {
            mockPrismaService.product.create.mockRejectedValueOnce({ code: 'P2002' });
            await (0, globals_1.expect)(service.createProduct({ name: 'Test', categoryId: 'c1' })).rejects.toThrow(common_1.ConflictException);
        });
    });
    (0, globals_1.describe)('findAllForPos', () => {
        (0, globals_1.it)('should flatten nested relations properly', async () => {
            mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
                {
                    id: 'v1',
                    sku: 'SKU-01',
                    barcode: '123456',
                    basePrice: 100,
                    size: 'M',
                    color: 'Red',
                    product: { id: 'p1', name: 'T-Shirt', categoryId: 'c1' },
                    barcodes: [{ barcode: '098765' }],
                },
            ]);
            const result = await service.findAllForPos();
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0]).toEqual({
                id: 'v1',
                productId: 'p1',
                name: 'T-Shirt',
                categoryId: 'c1',
                sku: 'SKU-01',
                primaryBarcode: '123456',
                allBarcodes: ['123456', '098765'],
                price: 100,
                size: 'M',
                color: 'Red',
            });
        });
    });
});
//# sourceMappingURL=catalog.service.spec.js.map