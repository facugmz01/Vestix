"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const settings_service_1 = require("./settings.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const encryption_service_1 = require("../../core/crypto/encryption.service");
const mockPrismaService = {
    systemSettings: {
        findUnique: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
    },
    branch: {
        findFirst: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
    },
    $transaction: globals_1.jest.fn((cb) => cb(mockPrismaService)),
};
const mockAuditService = {
    log: globals_1.jest.fn().mockResolvedValue(undefined),
};
const mockEncryptionService = {
    encrypt: globals_1.jest.fn((val) => `enc:${val}`),
    decrypt: globals_1.jest.fn((val) => val.replace('enc:', '')),
    mask: globals_1.jest.fn(() => '••••••••'),
};
const defaultRow = {
    id: 'default',
    general: { companyName: 'Vestix', currency: 'ARS' },
    pricing: { vatDefaultPct: 21 },
    notifications: { emailEnabled: true, smtpPass: 'enc:secret123' },
    integrations: { mercadopagoEnabled: false, mpAccessToken: 'enc:token123' },
    pos: { allowNegativeStock: false },
    storefront: { enabled: false },
    pwa: { appName: 'Vestix' },
    skuBarcode: { skuPrefix: 'VX' },
    arca: { enabled: false },
    offline: { offlineModeEnabled: false },
};
(0, globals_1.describe)('SettingsService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                settings_service_1.SettingsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
                { provide: encryption_service_1.EncryptionService, useValue: mockEncryptionService },
            ],
        }).compile();
        service = module.get(settings_service_1.SettingsService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('getSettings', () => {
        (0, globals_1.it)('should return masked settings for HTTP responses', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            const result = await service.getSettings();
            (0, globals_1.expect)(result.notifications.smtpPass).toBe('••••••••');
            (0, globals_1.expect)(result.integrations.mpAccessToken).toBe('••••••••');
            (0, globals_1.expect)(result.general.companyName).toBe('Vestix');
        });
    });
    (0, globals_1.describe)('getGeneralSettings', () => {
        (0, globals_1.it)('should return the general section from cached row', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            const result = await service.getGeneralSettings();
            (0, globals_1.expect)(result.companyName).toBe('Vestix');
        });
        (0, globals_1.it)('should return empty object when row has no general section', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce({ id: 'default' });
            const result = await service.getGeneralSettings();
            (0, globals_1.expect)(result).toEqual({});
        });
    });
    (0, globals_1.describe)('getPricingSettings', () => {
        (0, globals_1.it)('should return pricing section', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            const result = await service.getPricingSettings();
            (0, globals_1.expect)(result.vatDefaultPct).toBe(21);
        });
    });
    (0, globals_1.describe)('getPosSettings', () => {
        (0, globals_1.it)('should return pos section', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            const result = await service.getPosSettings();
            (0, globals_1.expect)(result.allowNegativeStock).toBe(false);
        });
    });
    (0, globals_1.describe)('getNotificationSettings', () => {
        (0, globals_1.it)('should return decrypted notification settings', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            const result = await service.getNotificationSettings();
            (0, globals_1.expect)(mockEncryptionService.decrypt).toHaveBeenCalledWith('enc:secret123');
            (0, globals_1.expect)(result.emailEnabled).toBe(true);
        });
    });
    (0, globals_1.describe)('updateSection', () => {
        (0, globals_1.it)('should update a section and audit the change', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            mockPrismaService.systemSettings.update.mockResolvedValueOnce({ ...defaultRow, pricing: { vatDefaultPct: 10.5 } });
            await service.updateSection('pricing', { vatDefaultPct: 10.5 }, 'user-1');
            (0, globals_1.expect)(mockPrismaService.systemSettings.update).toHaveBeenCalledWith({
                where: { id: 'default' },
                data: { pricing: globals_1.expect.objectContaining({ vatDefaultPct: 10.5 }) },
            });
            (0, globals_1.expect)(mockAuditService.log).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                userId: 'user-1',
                resource: 'SystemSettings',
                module: 'SettingsService',
            }));
        });
        (0, globals_1.it)('should strip masked sentinel values before persisting', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);
            await service.updateSection('notifications', { smtpPass: '••••••••', smtpHost: 'smtp.new.com' }, 'user-1');
            const updateCall = mockPrismaService.systemSettings.update.mock.calls[0][0];
            const persistedNotifications = updateCall.data.notifications;
            (0, globals_1.expect)(persistedNotifications.smtpHost).toBe('smtp.new.com');
            (0, globals_1.expect)(persistedNotifications.smtpPass).not.toBe('••••••••');
        });
        (0, globals_1.it)('should sanitize NaN and null values from the DTO', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);
            await service.updateSection('pricing', { vatDefaultPct: 21, badField: NaN, nullField: null }, 'user-1');
            const updateCall = mockPrismaService.systemSettings.update.mock.calls[0][0];
            const persisted = updateCall.data.pricing;
            (0, globals_1.expect)(persisted.vatDefaultPct).toBe(21);
            (0, globals_1.expect)('badField' in persisted).toBe(false);
            (0, globals_1.expect)('nullField' in persisted).toBe(false);
        });
        (0, globals_1.it)('should throw when default row is not found', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(null);
            await (0, globals_1.expect)(service.updateSection('pricing', {}, 'user-1')).rejects.toThrow('SystemSettings default row not found');
        });
        (0, globals_1.it)('should sync general settings to main branch', async () => {
            const branch = { id: 'branch-1', isMain: true, name: 'Old', settings: {} };
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);
            mockPrismaService.branch.findFirst.mockResolvedValueOnce(branch);
            mockPrismaService.branch.update.mockResolvedValueOnce(branch);
            await service.updateSection('general', { companyName: 'New Co', address: '123 St' }, 'user-1');
            (0, globals_1.expect)(mockPrismaService.branch.findFirst).toHaveBeenCalledWith({ where: { isMain: true } });
            (0, globals_1.expect)(mockPrismaService.branch.update).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('updateAllSettings', () => {
        (0, globals_1.it)('should bulk update multiple sections', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
            mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);
            await service.updateAllSettings({ pricing: { vatDefaultPct: 10 }, pos: { allowNegativeStock: true } }, 'user-1');
            (0, globals_1.expect)(mockPrismaService.systemSettings.update).toHaveBeenCalled();
            (0, globals_1.expect)(mockAuditService.log).toHaveBeenCalled();
        });
        (0, globals_1.it)('should throw when default row is not found', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(null);
            await (0, globals_1.expect)(service.updateAllSettings({}, 'user-1')).rejects.toThrow('SystemSettings default row not found');
        });
    });
    (0, globals_1.describe)('testAfipConnection', () => {
        (0, globals_1.it)('should return a not-available response', async () => {
            const result = await service.testAfipConnection();
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toContain('no disponible');
        });
    });
    (0, globals_1.describe)('testSmtpConnection', () => {
        (0, globals_1.it)('should return error when smtpHost is missing', async () => {
            const result = await service.testSmtpConnection({});
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toContain('Host SMTP');
        });
    });
    (0, globals_1.describe)('testSmsConnection', () => {
        (0, globals_1.it)('should return error when smsGatewayUrl is missing', async () => {
            const result = await service.testSmsConnection({});
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toContain('URL del Gateway SMS');
        });
    });
    (0, globals_1.describe)('testWhatsappConnection', () => {
        (0, globals_1.it)('should return error when evolutionApiUrl is missing', async () => {
            const result = await service.testWhatsappConnection({});
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toContain('URL de Evolution API');
        });
        (0, globals_1.it)('should return error when apiKey is missing', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce({
                ...defaultRow,
                notifications: { evolutionApiKey: undefined },
            });
            const result = await service.testWhatsappConnection({ evolutionApiUrl: 'http://api.test' });
            (0, globals_1.expect)(result.success).toBe(false);
        });
    });
    (0, globals_1.describe)('testPushConnection', () => {
        (0, globals_1.it)('should return error when fcmServerKey is missing', async () => {
            mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce({
                ...defaultRow,
                notifications: { fcmServerKey: undefined },
            });
            const result = await service.testPushConnection({});
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toContain('FCM');
        });
    });
});
//# sourceMappingURL=settings.service.spec.js.map