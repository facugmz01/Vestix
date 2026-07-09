import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

/**
 * Tests the Disponible invariant: available = physical − reserved
 * and that sales decrease / returns increase Disponible correctly.
 */
describe('InventoryService.updateStock / recordMovement direction', () => {
  let service: InventoryService;
  let prisma: any;
  let settingsService: any;
  let stockState: {
    id: string;
    variantId: string;
    warehouseId: string;
    batchId: string | null;
    branchId: string;
    physicalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  };

  beforeEach(() => {
    stockState = {
      id: 'sl-1',
      variantId: 'var-1',
      warehouseId: 'wh-1',
      batchId: null,
      branchId: 'br-1',
      physicalQuantity: 20,
      reservedQuantity: 5,
      availableQuantity: 15, // may be drifted; engine must re-derive
    };

    prisma = {
      $transaction: jest.fn((fn: any) => fn(prisma)),
      inventoryMovement: {
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({ id: 'mov-1', ...data, createdAt: new Date() }),
        ),
      },
      outboxEvent: { create: jest.fn().mockResolvedValue({}) },
      stockLevel: {
        findFirst: jest.fn().mockImplementation(() =>
          Promise.resolve({ ...stockState }),
        ),
        update: jest.fn().mockImplementation(({ data }: any) => {
          stockState = { ...stockState, ...data };
          return Promise.resolve({ ...stockState });
        }),
        create: jest.fn(),
      },
    };

    settingsService = {
      getPosSettings: jest.fn().mockResolvedValue({ allowNegativeStock: false }),
    };

    service = new InventoryService(prisma, settingsService, {
      checkLowStock: jest.fn(),
    } as any);
  });

  it('SALE_EXIT decreases physical and available (Disponible goes down)', async () => {
    await service.recordMovement({
      variantId: 'var-1',
      sourceWarehouseId: 'wh-1',
      destinationWarehouseId: null,
      branchId: 'br-1',
      type: 'SALE_EXIT',
      quantity: 3,
      referenceId: 'order-1',
    });

    expect(prisma.stockLevel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          physicalQuantity: 17, // 20 - 3
          reservedQuantity: 5,
          availableQuantity: 12, // 17 - 5
        }),
      }),
    );
  });

  it('SALE_RETURN increases physical and available (Disponible goes up)', async () => {
    await service.recordMovement({
      variantId: 'var-1',
      sourceWarehouseId: null,
      destinationWarehouseId: 'wh-1',
      branchId: 'br-1',
      type: 'SALE_RETURN',
      quantity: 2,
      referenceId: 'return-1',
    });

    expect(prisma.stockLevel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          physicalQuantity: 22, // 20 + 2
          reservedQuantity: 5,
          availableQuantity: 17, // 22 - 5
        }),
      }),
    );
  });

  it('rejects SALE_EXIT recorded as inbound (would wrongly increase Disponible)', async () => {
    await expect(
      service.recordMovement({
        variantId: 'var-1',
        sourceWarehouseId: null,
        destinationWarehouseId: 'wh-1',
        branchId: 'br-1',
        type: 'SALE_EXIT',
        quantity: 1,
      }),
    ).rejects.toThrow(/origen/);
  });

  it('rejects SALE_RETURN recorded as outbound', async () => {
    await expect(
      service.recordMovement({
        variantId: 'var-1',
        sourceWarehouseId: 'wh-1',
        destinationWarehouseId: null,
        branchId: 'br-1',
        type: 'SALE_RETURN',
        quantity: 1,
      }),
    ).rejects.toThrow(/destino/);
  });

  it('RESERVATION decreases available without changing physical', async () => {
    await service.recordMovement({
      variantId: 'var-1',
      sourceWarehouseId: null,
      destinationWarehouseId: 'wh-1',
      branchId: 'br-1',
      type: 'RESERVATION',
      quantity: 4,
      referenceId: 'order-2',
    });

    expect(prisma.stockLevel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          physicalQuantity: 20,
          reservedQuantity: 9, // 5 + 4
          availableQuantity: 11, // 20 - 9
        }),
      }),
    );
  });

  it('CONSUME_RESERVATION decreases physical+reserved; available unchanged', async () => {
    await service.recordMovement({
      variantId: 'var-1',
      sourceWarehouseId: 'wh-1',
      destinationWarehouseId: null,
      branchId: 'br-1',
      type: 'CONSUME_RESERVATION',
      quantity: 3,
      referenceId: 'order-3',
    });

    expect(prisma.stockLevel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          physicalQuantity: 17, // 20 - 3
          reservedQuantity: 2, // 5 - 3
          availableQuantity: 15, // 17 - 2 (same as before)
        }),
      }),
    );
  });

  it('heals drifted availableQuantity on next movement', async () => {
    // Simulate historical drift: stored available is wrong (20 instead of 15)
    stockState.availableQuantity = 20;

    await service.recordMovement({
      variantId: 'var-1',
      sourceWarehouseId: 'wh-1',
      destinationWarehouseId: null,
      branchId: 'br-1',
      type: 'SALE',
      quantity: 1,
    });

    // After sale: physical 19, reserved 5 → available MUST be 14 (not 19)
    expect(prisma.stockLevel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          physicalQuantity: 19,
          availableQuantity: 14,
        }),
      }),
    );
  });

  it('GOODS_RECEIPT increases Disponible', async () => {
    await service.recordMovement({
      variantId: 'var-1',
      sourceWarehouseId: null,
      destinationWarehouseId: 'wh-1',
      branchId: 'br-1',
      type: 'GOODS_RECEIPT',
      quantity: 10,
    });

    expect(prisma.stockLevel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          physicalQuantity: 30,
          availableQuantity: 25, // 30 - 5
        }),
      }),
    );
  });

  it('blocks outbound when Disponible would go negative', async () => {
    stockState.physicalQuantity = 5;
    stockState.reservedQuantity = 4;
    stockState.availableQuantity = 1;

    await expect(
      service.recordMovement({
        variantId: 'var-1',
        sourceWarehouseId: 'wh-1',
        destinationWarehouseId: null,
        branchId: 'br-1',
        type: 'SALE_EXIT',
        quantity: 3, // available is only 1
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
