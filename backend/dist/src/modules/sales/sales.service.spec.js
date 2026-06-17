"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const sales_service_1 = require("./sales.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const common_1 = require("@nestjs/common");
const mockPrismaService = {
    $transaction: globals_1.jest.fn((callback) => callback(mockPrismaService)),
    productVariant: {
        findUnique: globals_1.jest.fn(),
    },
    saleOrder: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
    },
    saleOrderVariance: {
        create: globals_1.jest.fn(),
    },
};
const mockInventoryService = {
    recordMovement: globals_1.jest.fn(),
};
(0, globals_1.describe)('SalesService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                sales_service_1.SalesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: inventory_service_1.InventoryService, useValue: mockInventoryService },
            ],
        }).compile();
        service = module.get(sales_service_1.SalesService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('createSale', () => {
        (0, globals_1.it)('should throw if variant not found', async () => {
            mockPrismaService.productVariant.findUnique.mockResolvedValueOnce(null);
            await (0, globals_1.expect)(service.createSale({
                branchId: 'b1',
                warehouseId: 'w1',
                posGrandTotal: 100,
                lines: [{ variantId: 'v1', quantity: 1, unitPriceOverride: 100 }],
            })).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should create a sale and deduct inventory', async () => {
            mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({
                id: 'v1',
                sku: 'SKU1',
                costPrice: 50,
                basePrice: 50,
                product: { name: 'Prod1', categoryId: 'c1' },
            });
            mockPrismaService.saleOrder.findUnique.mockResolvedValueOnce(null);
            mockPrismaService.saleOrder.create.mockResolvedValueOnce({ id: 'order1' });
            await service.createSale({
                branchId: 'b1',
                warehouseId: 'w1',
                posGrandTotal: 100,
                lines: [{ variantId: 'v1', quantity: 2, unitPriceOverride: 50 }],
            });
            (0, globals_1.expect)(mockInventoryService.recordMovement).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                variantId: 'v1',
                quantity: 2,
                type: 'SALE',
            }), mockPrismaService);
            (0, globals_1.expect)(mockPrismaService.saleOrder.create).toHaveBeenCalled();
            (0, globals_1.expect)(mockPrismaService.saleOrderVariance.create).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('should create variance if posTotal differs', async () => {
            mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({
                id: 'v1',
                sku: 'SKU1',
                costPrice: 50,
                basePrice: 100,
                product: { name: 'Prod1', categoryId: 'c1' },
            });
            mockPrismaService.saleOrder.findUnique.mockResolvedValueOnce(null);
            mockPrismaService.saleOrder.create.mockResolvedValueOnce({ id: 'order1' });
            await service.createSale({
                branchId: 'b1',
                warehouseId: 'w1',
                posGrandTotal: 90,
                lines: [{ variantId: 'v1', quantity: 1, unitPriceOverride: 100 }],
            });
            (0, globals_1.expect)(mockPrismaService.saleOrderVariance.create).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: globals_1.expect.objectContaining({
                    posTotal: 90,
                    serverTotal: 100,
                    difference: 10,
                }),
            }));
        });
    });
});
//# sourceMappingURL=sales.service.spec.js.map