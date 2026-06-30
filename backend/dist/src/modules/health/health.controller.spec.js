"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const health_controller_1 = require("./health.controller");
const terminus_1 = require("@nestjs/terminus");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mockHealthCheckService = {
    check: globals_1.jest.fn(),
};
const mockPrismaHealthIndicator = {
    pingCheck: globals_1.jest.fn(),
};
const mockPrismaService = {};
(0, globals_1.describe)('HealthController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
            providers: [
                { provide: terminus_1.HealthCheckService, useValue: mockHealthCheckService },
                { provide: terminus_1.PrismaHealthIndicator, useValue: mockPrismaHealthIndicator },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        controller = module.get(health_controller_1.HealthController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('check', () => {
        (0, globals_1.it)('should call health.check with a prisma ping indicator', () => {
            const healthResult = { status: 'ok', details: { postgresql: { status: 'up' } } };
            mockHealthCheckService.check.mockReturnValue(healthResult);
            const result = controller.check();
            (0, globals_1.expect)(mockHealthCheckService.check).toHaveBeenCalledWith([globals_1.expect.any(Function)]);
            (0, globals_1.expect)(result).toEqual(healthResult);
        });
        (0, globals_1.it)('should pass prisma service to pingCheck within the indicator function', () => {
            mockHealthCheckService.check.mockImplementation((indicators) => {
                indicators[0]();
                return { status: 'ok' };
            });
            controller.check();
            (0, globals_1.expect)(mockPrismaHealthIndicator.pingCheck).toHaveBeenCalledWith('postgresql', mockPrismaService);
        });
    });
});
//# sourceMappingURL=health.controller.spec.js.map