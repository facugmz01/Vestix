import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

const mockPosService: any = {
  createQrOrder: jest.fn(),
  getQrOrderStatus: jest.fn(),
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

  it('gets QR order status via service', async () => {
    mockPosService.getQrOrderStatus.mockReturnValue({ orderId: 'POS-QR-1', status: 'PENDING', amount: 1000 });
    const result = await controller.getQrOrderStatus('POS-QR-1');
    expect(result.status).toBe('PENDING');
  });
});
