import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';

const mockTreasuryService: any = {
  findAllShifts: jest.fn(),
  getActiveShift: jest.fn(),
  findOneShift: jest.fn(),
  getShiftMovements: jest.fn(),
  createMovement: jest.fn(),
  openShift: jest.fn(),
  closeShift: jest.fn(),
};

describe('TreasuryController', () => {
  let controller: TreasuryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreasuryController],
      providers: [{ provide: TreasuryService, useValue: mockTreasuryService }],
    }).compile();

    controller = module.get<TreasuryController>(TreasuryController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllShifts', () => {
    it('should delegate to treasuryService', () => {
      mockTreasuryService.findAllShifts.mockReturnValue([]);
      expect(controller.findAllShifts({})).toEqual([]);
    });
  });

  describe('getActiveShift', () => {
    it('should pass user sub from request', () => {
      const req = { user: { sub: 'u1' } };
      mockTreasuryService.getActiveShift.mockReturnValue({ id: 's1' });
      const result = controller.getActiveShift(req);
      expect(mockTreasuryService.getActiveShift).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ id: 's1' });
    });
  });

  describe('findOneShift', () => {
    it('should delegate to treasuryService', () => {
      mockTreasuryService.findOneShift.mockReturnValue({ id: 's1' });
      expect(controller.findOneShift('s1')).toEqual({ id: 's1' });
    });
  });

  describe('openShift', () => {
    it('should pass dto and user sub', () => {
      const dto = { cashRegisterId: 'cr1', openingAmount: 1000 };
      const req = { user: { sub: 'u1' } };
      mockTreasuryService.openShift.mockReturnValue({ id: 's1' });
      const result = controller.openShift(dto as any, req);
      expect(mockTreasuryService.openShift).toHaveBeenCalledWith(dto, 'u1');
      expect(result).toEqual({ id: 's1' });
    });
  });

  describe('closeShift', () => {
    it('should pass dto and user sub', () => {
      const dto = { shiftId: 's1', closingAmount: 2000 };
      const req = { user: { sub: 'u1' } };
      mockTreasuryService.closeShift.mockReturnValue({ id: 's1', status: 'CLOSED' });
      const result = controller.closeShift(dto as any, req);
      expect(mockTreasuryService.closeShift).toHaveBeenCalledWith(dto, 'u1');
      expect(result).toEqual({ id: 's1', status: 'CLOSED' });
    });
  });
});
