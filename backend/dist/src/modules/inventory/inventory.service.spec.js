"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const inventory_service_1 = require("./inventory.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const movement_type_enum_1 = require("./enums/movement-type.enum");
const common_1 = require("@nestjs/common");
const mockPrismaService = {
    $transaction: globals_1.jest.fn((callback) => callback(mockPrismaService)),
    inventoryMovement: {
        create: globals_1.jest.fn().mockImplementation((data) => Promise.resolve({ id: 'mov1', ...data.data })),
    },
    stockLevel: {
        findUnique: globals_1.jest.fn(),
        findFirst: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
    },
};
(0, globals_1.describe)('InventoryService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                inventory_service_1.InventoryService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(inventory_service_1.InventoryService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('recordMovement', () => {
        (0, globals_1.it)('should throw error if GOODS_RECEIPT has no destination', async () => {
            await (0, globals_1.expect)(service.recordMovement({
                variantId: 'v1',
                quantity: 10,
                type: movement_type_enum_1.MovementType.GOODS_RECEIPT,
            })).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should create movement and increment stock on GOODS_RECEIPT', async () => {
            mockPrismaService.stockLevel.findFirst.mockResolvedValueOnce(null);
            mockPrismaService.stockLevel.create.mockResolvedValueOnce({ id: 's1', physicalQuantity: 10 });
            const result = await service.recordMovement({
                variantId: 'v1',
                quantity: 10,
                type: movement_type_enum_1.MovementType.GOODS_RECEIPT,
                destinationWarehouseId: 'w1',
            });
            (0, globals_1.expect)(mockPrismaService.inventoryMovement.create).toHaveBeenCalled();
            (0, globals_1.expect)(mockPrismaService.stockLevel.create).toHaveBeenCalledWith({
                data: {
                    variantId: 'v1',
                    warehouseId: 'w1',
                    batchId: null,
                    physicalQuantity: 10,
                    availableQuantity: 10,
                },
            });
            (0, globals_1.expect)(result).toBeDefined();
        });
        (0, globals_1.it)('should throw error if SALE has no source', async () => {
            await (0, globals_1.expect)(service.recordMovement({
                variantId: 'v1',
                quantity: 2,
                type: movement_type_enum_1.MovementType.SALE,
            })).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should throw error if insufficient stock on SALE', async () => {
            mockPrismaService.stockLevel.findFirst.mockResolvedValueOnce({
                id: 's1',
                physicalQuantity: 1,
            });
            await (0, globals_1.expect)(service.recordMovement({
                variantId: 'v1',
                quantity: 2,
                type: movement_type_enum_1.MovementType.SALE,
                sourceWarehouseId: 'w1',
            })).rejects.toThrow('Insufficient stock');
        });
        (0, globals_1.it)('should decrement stock on successful SALE', async () => {
            mockPrismaService.stockLevel.findFirst.mockResolvedValueOnce({
                id: 's1',
                physicalQuantity: 10,
            });
            await service.recordMovement({
                variantId: 'v1',
                quantity: 2,
                type: movement_type_enum_1.MovementType.SALE,
                sourceWarehouseId: 'w1',
            });
            (0, globals_1.expect)(mockPrismaService.stockLevel.update).toHaveBeenCalledWith({
                where: { id: 's1' },
                data: {
                    physicalQuantity: { decrement: 2 },
                    availableQuantity: { decrement: 2 },
                },
            });
        });
    });
});
//# sourceMappingURL=inventory.service.spec.js.map