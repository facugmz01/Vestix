import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService.adjustStock', () => {
  let service: InventoryService;
  let prisma: any;
  let settingsService: any;
  let notificationTriggers: any;

  beforeEach(() => {
    prisma = {
      warehouse: { findUnique: jest.fn() },
      productVariant: { findUnique: jest.fn() },
      stockLevel: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      branch: { findUnique: jest.fn() },
      $transaction: jest.fn((fn: any) => fn(prisma)),
      inventoryMovement: { create: jest.fn() },
      outboxEvent: { create: jest.fn() },
    };
    settingsService = {
      getPosSettings: jest.fn().mockResolvedValue({ allowNegativeStock: false }),
    };
    notificationTriggers = {
      checkLowStock: jest.fn(),
    };
    service = new InventoryService(prisma, settingsService, notificationTriggers);
  });

  const baseSetup = (stock?: Partial<{ physicalQuantity: number; availableQuantity: number; reservedQuantity: number; branchId: string; batchId: string | null; id: string }>) => {
    prisma.warehouse.findUnique.mockResolvedValue({ id: 'wh-1', branchId: 'br-1', name: 'Depósito Central' });
    prisma.productVariant.findUnique.mockResolvedValue({
      id: 'var-1',
      sku: 'SKU-1',
      product: { name: 'Remera' },
    });
    prisma.branch.findUnique.mockResolvedValue({ id: 'br-1', name: 'Casa Central' });

    if (stock) {
      const row = {
        id: stock.id || 'sl-1',
        variantId: 'var-1',
        warehouseId: 'wh-1',
        branchId: stock.branchId || 'br-1',
        batchId: stock.batchId ?? null,
        physicalQuantity: stock.physicalQuantity ?? 0,
        availableQuantity: stock.availableQuantity ?? 0,
        reservedQuantity: stock.reservedQuantity ?? 0,
        updatedAt: new Date(),
      };
      prisma.stockLevel.findMany.mockResolvedValue([row]);
      prisma.stockLevel.findFirst.mockResolvedValue(row);
      prisma.stockLevel.update = jest.fn().mockResolvedValue(row);
    } else {
      prisma.stockLevel.findMany.mockResolvedValue([]);
      prisma.stockLevel.findFirst.mockResolvedValue(null);
      prisma.stockLevel.create = jest.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'sl-new', ...data, updatedAt: new Date() }),
      );
    }

    prisma.inventoryMovement.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'mov-1', ...data, createdAt: new Date() }),
    );
    prisma.outboxEvent.create.mockResolvedValue({});
  };

  it('rejects missing reason', async () => {
    await expect(
      service.adjustStock({
        variantId: 'var-1',
        warehouseId: 'wh-1',
        quantity: 1,
        type: 'ADD',
        reason: '  ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ADD increases physical and available', async () => {
    baseSetup({ physicalQuantity: 10, availableQuantity: 8, reservedQuantity: 2 });
    prisma.stockLevel.findFirst
      .mockResolvedValueOnce({
        id: 'sl-1',
        variantId: 'var-1',
        warehouseId: 'wh-1',
        branchId: 'br-1',
        batchId: null,
        physicalQuantity: 10,
        availableQuantity: 8,
        reservedQuantity: 2,
      })
      .mockResolvedValueOnce({
        id: 'sl-1',
        variantId: 'var-1',
        warehouseId: 'wh-1',
        branchId: 'br-1',
        batchId: null,
        physicalQuantity: 15,
        availableQuantity: 13,
        reservedQuantity: 2,
        updatedAt: new Date(),
      });

    const result = await service.adjustStock({
      variantId: 'var-1',
      warehouseId: 'wh-1',
      quantity: 5,
      type: 'ADD',
      reason: 'Sobrante de recepción',
    });

    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'ADJUSTMENT',
          quantity: 5,
          destinationWarehouseId: 'wh-1',
          sourceWarehouseId: null,
          referenceId: 'Sobrante de recepción',
        }),
      }),
    );
    expect(result.physicalQuantity).toBe(15);
    expect(result.availableQuantity).toBe(13);
    expect(result.movementId).toBe('mov-1');
  });

  it('SUBTRACT rejects when exceeding available and negative stock disabled', async () => {
    baseSetup({ physicalQuantity: 10, availableQuantity: 3, reservedQuantity: 7 });

    await expect(
      service.adjustStock({
        variantId: 'var-1',
        warehouseId: 'wh-1',
        quantity: 5,
        type: 'SUBTRACT',
        reason: 'Merma',
      }),
    ).rejects.toThrow(/Stock insuficiente/);
  });

  it('SET uses physicalQuantity as baseline (not available)', async () => {
    baseSetup({ physicalQuantity: 10, availableQuantity: 7, reservedQuantity: 3 });
    // First findFirst inside updateStock, second after adjust for enrich
    prisma.stockLevel.findFirst
      .mockResolvedValueOnce({
        id: 'sl-1',
        variantId: 'var-1',
        warehouseId: 'wh-1',
        branchId: 'br-1',
        batchId: null,
        physicalQuantity: 10,
        availableQuantity: 7,
        reservedQuantity: 3,
      })
      .mockResolvedValueOnce({
        id: 'sl-1',
        variantId: 'var-1',
        warehouseId: 'wh-1',
        branchId: 'br-1',
        batchId: null,
        physicalQuantity: 12,
        availableQuantity: 9,
        reservedQuantity: 3,
        updatedAt: new Date(),
      });

    await service.adjustStock({
      variantId: 'var-1',
      warehouseId: 'wh-1',
      quantity: 12,
      type: 'SET',
      reason: 'Conteo físico',
    });

    // diff = 12 - 10 (physical) = +2, NOT 12 - 7 (available)
    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'ADJUSTMENT',
          quantity: 2,
          destinationWarehouseId: 'wh-1',
        }),
      }),
    );
  });

  it('SET rejects when below reserved quantity', async () => {
    baseSetup({ physicalQuantity: 10, availableQuantity: 4, reservedQuantity: 6 });

    await expect(
      service.adjustStock({
        variantId: 'var-1',
        warehouseId: 'wh-1',
        quantity: 3,
        type: 'SET',
        reason: 'Conteo erróneo',
      }),
    ).rejects.toThrow(/reservadas/);
  });

  it('returns current stock without movement when SET equals physical', async () => {
    baseSetup({ physicalQuantity: 10, availableQuantity: 10, reservedQuantity: 0 });

    const result = await service.adjustStock({
      variantId: 'var-1',
      warehouseId: 'wh-1',
      quantity: 10,
      type: 'SET',
      reason: 'Sin cambios',
    });

    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(result.physicalQuantity).toBe(10);
  });
});
