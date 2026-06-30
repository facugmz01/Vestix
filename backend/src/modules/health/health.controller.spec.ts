import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockHealthCheckService: any = {
  check: jest.fn(),
};

const mockPrismaHealthIndicator: any = {
  pingCheck: jest.fn(),
};

const mockPrismaService: any = {};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaHealthIndicator },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should call health.check with a prisma ping indicator', () => {
      const healthResult = { status: 'ok', details: { postgresql: { status: 'up' } } };
      mockHealthCheckService.check.mockReturnValue(healthResult);

      const result = controller.check();

      expect(mockHealthCheckService.check).toHaveBeenCalledWith([expect.any(Function)]);
      expect(result).toEqual(healthResult);
    });

    it('should pass prisma service to pingCheck within the indicator function', () => {
      mockHealthCheckService.check.mockImplementation((indicators: (() => any)[]) => {
        indicators[0]();
        return { status: 'ok' };
      });

      controller.check();

      expect(mockPrismaHealthIndicator.pingCheck).toHaveBeenCalledWith('postgresql', mockPrismaService);
    });
  });
});
