import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PurchasingController } from './purchasing.controller';
import { PurchasingService } from './purchasing.service';

const mockPurchasingService: any = {
  createPurchaseOrder: jest.fn(),
  receiveGoods: jest.fn(),
  findAllOrders: jest.fn(),
  findOneOrder: jest.fn(),
  findAllReceipts: jest.fn(),
  findOneReceipt: jest.fn(),
  prisma: {
    purchaseOrder: {
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
};

describe('PurchasingController', () => {
  let controller: PurchasingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasingController],
      providers: [{ provide: PurchasingService, useValue: mockPurchasingService }],
    }).compile();

    controller = module.get<PurchasingController>(PurchasingController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPurchaseOrder', () => {
    it('should delegate to purchasingService', () => {
      const dto = { supplierId: 's1', items: [] };
      mockPurchasingService.createPurchaseOrder.mockReturnValue({ id: 'po1' });
      const result = controller.createPurchaseOrder(dto as any);
      expect(mockPurchasingService.createPurchaseOrder).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'po1' });
    });
  });

  describe('findAllOrders', () => {
    it('should delegate to purchasingService', () => {
      mockPurchasingService.findAllOrders.mockReturnValue([]);
      const result = controller.findAllOrders({});
      expect(result).toEqual([]);
    });
  });

  describe('findOneOrder', () => {
    it('should delegate to purchasingService', () => {
      mockPurchasingService.findOneOrder.mockReturnValue({ id: 'po1' });
      const result = controller.findOneOrder('po1');
      expect(mockPurchasingService.findOneOrder).toHaveBeenCalledWith('po1');
      expect(result).toEqual({ id: 'po1' });
    });
  });

  describe('issueOrder', () => {
    it('should update order status to ISSUED via prisma', () => {
      mockPurchasingService.prisma.purchaseOrder.update.mockReturnValue({ id: 'po1', status: 'ISSUED' });
      const result = controller.issueOrder('po1');
      expect(mockPurchasingService.prisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po1' },
        data: { status: 'ISSUED' },
      });
      expect(result).toEqual({ id: 'po1', status: 'ISSUED' });
    });
  });

  describe('removeOrder', () => {
    it('should delete via prisma', () => {
      mockPurchasingService.prisma.purchaseOrder.delete.mockReturnValue({ id: 'po1' });
      const result = controller.removeOrder('po1');
      expect(mockPurchasingService.prisma.purchaseOrder.delete).toHaveBeenCalledWith({ where: { id: 'po1' } });
      expect(result).toEqual({ id: 'po1' });
    });
  });
});
