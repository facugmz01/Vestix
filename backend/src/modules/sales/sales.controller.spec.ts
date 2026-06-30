import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

const mockSalesService: any = {
  createSale: jest.fn(),
};

describe('SalesController', () => {
  let controller: SalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [{ provide: SalesService, useValue: mockSalesService }],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSale', () => {
    it('should return SUCCESS status with the order', async () => {
      const order = { id: 'o1', grandTotal: 500 };
      mockSalesService.createSale.mockResolvedValueOnce(order);
      const result = await controller.createSale({ items: [] } as any);
      expect(result).toEqual({ status: 'SUCCESS', order });
    });
  });
});
