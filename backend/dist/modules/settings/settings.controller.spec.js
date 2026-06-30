"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const settings_controller_1 = require("./settings.controller");
const settings_service_1 = require("./settings.service");
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../../core/rbac/guards/permissions.guard");
const mockSettingsService = {
    getSettings: globals_1.jest.fn(),
    updateSection: globals_1.jest.fn(),
    updateAllSettings: globals_1.jest.fn(),
    testAfipConnection: globals_1.jest.fn(),
    testSmtpConnection: globals_1.jest.fn(),
    testSmsConnection: globals_1.jest.fn(),
    testWhatsappConnection: globals_1.jest.fn(),
    testPushConnection: globals_1.jest.fn(),
};
(0, globals_1.describe)('SettingsController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [settings_controller_1.SettingsController],
            providers: [{ provide: settings_service_1.SettingsService, useValue: mockSettingsService }],
        })
            .overrideGuard((0, passport_1.AuthGuard)('jwt'))
            .useValue({ canActivate: () => true })
            .overrideGuard(permissions_guard_1.PermissionsGuard)
            .useValue({ canActivate: () => true })
            .compile();
        controller = module.get(settings_controller_1.SettingsController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('getSettings', () => {
        (0, globals_1.it)('should delegate to settingsService.getSettings', async () => {
            const expected = { general: { companyName: 'Vestix' } };
            mockSettingsService.getSettings.mockResolvedValueOnce(expected);
            const result = await controller.getSettings();
            (0, globals_1.expect)(result).toEqual(expected);
        });
    });
    (0, globals_1.describe)('patchSection', () => {
        const req = { user: { userId: 'u1' } };
        (0, globals_1.it)('should reject invalid section names', async () => {
            await (0, globals_1.expect)(controller.patchSection('invalid', {}, req)).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should update a valid section', async () => {
            const updated = { general: { companyName: 'NewCo' } };
            mockSettingsService.updateSection.mockResolvedValueOnce(updated);
            const result = await controller.patchSection('general', { companyName: 'NewCo' }, req);
            (0, globals_1.expect)(mockSettingsService.updateSection).toHaveBeenCalledWith('general', { companyName: 'NewCo' }, 'u1');
            (0, globals_1.expect)(result).toEqual(updated);
        });
        (0, globals_1.it)('should use "unknown" when req.user is missing', async () => {
            mockSettingsService.updateSection.mockResolvedValueOnce({});
            await controller.patchSection('pricing', { vatDefaultPct: 10 }, {});
            (0, globals_1.expect)(mockSettingsService.updateSection).toHaveBeenCalledWith('pricing', { vatDefaultPct: 10 }, 'unknown');
        });
    });
    (0, globals_1.describe)('updateAllSettings', () => {
        (0, globals_1.it)('should delegate to settingsService.updateAllSettings', async () => {
            const dto = { pricing: { vatDefaultPct: 10 } };
            const req = { user: { userId: 'u1' } };
            mockSettingsService.updateAllSettings.mockResolvedValueOnce({});
            await controller.updateAllSettings(dto, req);
            (0, globals_1.expect)(mockSettingsService.updateAllSettings).toHaveBeenCalledWith(dto, 'u1');
        });
    });
    (0, globals_1.describe)('testAfipConnection', () => {
        (0, globals_1.it)('should delegate to service', async () => {
            mockSettingsService.testAfipConnection.mockResolvedValueOnce({ success: false });
            const result = await controller.testAfipConnection();
            (0, globals_1.expect)(result).toEqual({ success: false });
        });
    });
    (0, globals_1.describe)('testSmtpConnection', () => {
        (0, globals_1.it)('should delegate to service', async () => {
            mockSettingsService.testSmtpConnection.mockResolvedValueOnce({ success: true });
            const result = await controller.testSmtpConnection({ smtpHost: 'smtp.test.com' });
            (0, globals_1.expect)(mockSettingsService.testSmtpConnection).toHaveBeenCalledWith({ smtpHost: 'smtp.test.com' });
            (0, globals_1.expect)(result).toEqual({ success: true });
        });
    });
    (0, globals_1.describe)('testSmsConnection', () => {
        (0, globals_1.it)('should delegate to service', async () => {
            mockSettingsService.testSmsConnection.mockResolvedValueOnce({ success: true });
            await controller.testSmsConnection({ smsGatewayUrl: 'http://sms.test' });
            (0, globals_1.expect)(mockSettingsService.testSmsConnection).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('testWhatsappConnection', () => {
        (0, globals_1.it)('should delegate to service', async () => {
            mockSettingsService.testWhatsappConnection.mockResolvedValueOnce({ success: true });
            await controller.testWhatsappConnection({ evolutionApiUrl: 'http://wa.test' });
            (0, globals_1.expect)(mockSettingsService.testWhatsappConnection).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('testPushConnection', () => {
        (0, globals_1.it)('should delegate to service', async () => {
            mockSettingsService.testPushConnection.mockResolvedValueOnce({ success: true });
            await controller.testPushConnection({ fcmServerKey: 'key' });
            (0, globals_1.expect)(mockSettingsService.testPushConnection).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('uploadLogo', () => {
        (0, globals_1.it)('should throw BadRequestException when no file uploaded', async () => {
            const req = { user: { userId: 'u1' } };
            await (0, globals_1.expect)(controller.uploadLogo(undefined, req)).rejects.toThrow(common_1.BadRequestException);
        });
        (0, globals_1.it)('should return logoUrl on successful upload', async () => {
            mockSettingsService.updateSection.mockResolvedValueOnce({});
            const file = { filename: 'logo-123.png' };
            const req = { user: { userId: 'u1' } };
            const result = await controller.uploadLogo(file, req);
            (0, globals_1.expect)(result).toEqual({ logoUrl: '/uploads/logos/logo-123.png' });
            (0, globals_1.expect)(mockSettingsService.updateSection).toHaveBeenCalledWith('general', { logoUrl: '/uploads/logos/logo-123.png' }, 'u1');
        });
    });
});
//# sourceMappingURL=settings.controller.spec.js.map