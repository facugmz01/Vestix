"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const treasury_controller_1 = require("./treasury.controller");
const treasury_service_1 = require("./treasury.service");
const mockTreasuryService = {
    findAllShifts: globals_1.jest.fn(),
    getActiveShift: globals_1.jest.fn(),
    findOneShift: globals_1.jest.fn(),
    getShiftMovements: globals_1.jest.fn(),
    createMovement: globals_1.jest.fn(),
    openShift: globals_1.jest.fn(),
    closeShift: globals_1.jest.fn(),
};
(0, globals_1.describe)('TreasuryController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [treasury_controller_1.TreasuryController],
            providers: [{ provide: treasury_service_1.TreasuryService, useValue: mockTreasuryService }],
        }).compile();
        controller = module.get(treasury_controller_1.TreasuryController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('findAllShifts', () => {
        (0, globals_1.it)('should delegate to treasuryService', () => {
            mockTreasuryService.findAllShifts.mockReturnValue([]);
            (0, globals_1.expect)(controller.findAllShifts({})).toEqual([]);
        });
    });
    (0, globals_1.describe)('getActiveShift', () => {
        (0, globals_1.it)('should pass user sub from request', () => {
            const req = { user: { sub: 'u1' } };
            mockTreasuryService.getActiveShift.mockReturnValue({ id: 's1' });
            const result = controller.getActiveShift(req);
            (0, globals_1.expect)(mockTreasuryService.getActiveShift).toHaveBeenCalledWith('u1');
            (0, globals_1.expect)(result).toEqual({ id: 's1' });
        });
    });
    (0, globals_1.describe)('findOneShift', () => {
        (0, globals_1.it)('should delegate to treasuryService', () => {
            mockTreasuryService.findOneShift.mockReturnValue({ id: 's1' });
            (0, globals_1.expect)(controller.findOneShift('s1')).toEqual({ id: 's1' });
        });
    });
    (0, globals_1.describe)('openShift', () => {
        (0, globals_1.it)('should pass dto and user sub', () => {
            const dto = { cashRegisterId: 'cr1', openingAmount: 1000 };
            const req = { user: { sub: 'u1' } };
            mockTreasuryService.openShift.mockReturnValue({ id: 's1' });
            const result = controller.openShift(dto, req);
            (0, globals_1.expect)(mockTreasuryService.openShift).toHaveBeenCalledWith(dto, 'u1');
            (0, globals_1.expect)(result).toEqual({ id: 's1' });
        });
    });
    (0, globals_1.describe)('closeShift', () => {
        (0, globals_1.it)('should pass dto and user sub', () => {
            const dto = { shiftId: 's1', closingAmount: 2000 };
            const req = { user: { sub: 'u1' } };
            mockTreasuryService.closeShift.mockReturnValue({ id: 's1', status: 'CLOSED' });
            const result = controller.closeShift(dto, req);
            (0, globals_1.expect)(mockTreasuryService.closeShift).toHaveBeenCalledWith(dto, 'u1');
            (0, globals_1.expect)(result).toEqual({ id: 's1', status: 'CLOSED' });
        });
    });
});
//# sourceMappingURL=treasury.controller.spec.js.map