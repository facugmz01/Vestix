"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const audit_controller_1 = require("./audit.controller");
(0, globals_1.describe)('AuditController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [audit_controller_1.AuditController],
        }).compile();
        controller = module.get(audit_controller_1.AuditController);
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('getLogs', () => {
        (0, globals_1.it)('should return empty data with total 0', () => {
            const result = controller.getLogs('1', '20');
            (0, globals_1.expect)(result).toEqual({ data: [], total: 0 });
        });
    });
});
//# sourceMappingURL=audit.controller.spec.js.map