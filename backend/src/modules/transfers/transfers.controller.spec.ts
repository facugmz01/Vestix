import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

const mockTransfersService: any = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  createTransfer: jest.fn(),
  dispatchTransfer: jest.fn(),
  receiveTransfer: jest.fn(),
  prisma: {
    stockTransfer: {
      update: jest.fn(),
    },
  },
};

describe('TransfersController', () => {
  let controller: TransfersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransfersController],
      providers: [{ provide: TransfersService, useValue: mockTransfersService }],
    }).compile();

    controller = module.get<TransfersController>(TransfersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to transfersService.findAll', () => {
      mockTransfersService.findAll.mockReturnValue([]);
      expect(controller.findAll({})).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should delegate to transfersService.findOne', () => {
      mockTransfersService.findOne.mockReturnValue({ id: 't1' });
      expect(controller.findOne('t1')).toEqual({ id: 't1' });
    });
  });

  describe('createTransfer', () => {
    it('should pass dto and user sub to service', () => {
      const dto = { originWarehouseId: 'w1', destinationWarehouseId: 'w2', items: [] };
      const req = { user: { sub: 'u1' } };
      mockTransfersService.createTransfer.mockReturnValue({ id: 't1' });
      const result = controller.createTransfer(dto as any, req);
      expect(mockTransfersService.createTransfer).toHaveBeenCalledWith(dto, 'u1');
      expect(result).toEqual({ id: 't1' });
    });
  });

  describe('dispatchTransfer', () => {
    it('should delegate to transfersService.dispatchTransfer', () => {
      mockTransfersService.dispatchTransfer.mockReturnValue({ id: 't1', status: 'IN_TRANSIT' });
      expect(controller.dispatchTransfer('t1')).toEqual({ id: 't1', status: 'IN_TRANSIT' });
    });
  });

  describe('cancelTransfer', () => {
    it('should update status to CANCELLED via prisma', () => {
      mockTransfersService.prisma.stockTransfer.update.mockReturnValue({ id: 't1', status: 'CANCELLED' });
      const result = controller.cancelTransfer('t1');
      expect(mockTransfersService.prisma.stockTransfer.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: 'CANCELLED' },
      });
      expect(result).toEqual({ id: 't1', status: 'CANCELLED' });
    });
  });
});
