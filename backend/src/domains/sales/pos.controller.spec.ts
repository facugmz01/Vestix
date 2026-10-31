import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

const mockPosService: any = {
  createQrOrder: jest.fn(),
  getQrOrderStatus: jest.fn(),
  searchCatalog: jest.fn(),
};

describe('PosController', () => {
  let controller: PosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [{ provide: PosService, useValue: mockPosService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PosController>(PosController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates QR order via service', async () => {
    mockPosService.createQrOrder.mockReturnValue({ orderId: 'POS-QR-1', qrData: 'qr-data' });
    const result = await controller.generateQrOrder({ amount: 1000, title: 'Test' });
    expect(mockPosService.createQrOrder).toHaveBeenCalledWith(1000, 'Test');
    expect(result).toEqual({ orderId: 'POS-QR-1', qrData: 'qr-data' });
  });

  it('delegates searchCatalog with parsed limit', async () => {
    mockPosService.searchCatalog.mockResolvedValueOnce([]);
    await controller.searchCatalog('remera', 'cust-1', 'cat-1', 'brand-1', 'branch-1', 'pl-1', '150');
    expect(mockPosService.searchCatalog).toHaveBeenCalledWith('remera', 'cust-1', {
      categoryId: 'cat-1',
      brandId: 'brand-1',
      branchId: 'branch-1',
      priceListId: 'pl-1',
      limit: 150,
    });
  });
});
