import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../../core/crypto/encryption.service';

const mockPrismaService: any = {
  systemSettings: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  branch: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrismaService)),
};

const mockAuditService: any = {
  log: jest.fn<any>().mockResolvedValue(undefined),
};

const mockEncryptionService: any = {
  encrypt: jest.fn((val: string) => `enc:${val}`),
  decrypt: jest.fn((val: string) => val.replace('enc:', '')),
  mask: jest.fn(() => '••••••••'),
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

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return masked settings for HTTP responses', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      const result = await service.getSettings();
      expect(result.notifications.smtpPass).toBe('••••••••');
      expect(result.integrations.mpAccessToken).toBe('••••••••');
      expect(result.general.companyName).toBe('Vestix');
    });
  });

  describe('getGeneralSettings', () => {
    it('should return the general section from cached row', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      const result = await service.getGeneralSettings();
      expect(result.companyName).toBe('Vestix');
    });

    it('should return empty object when row has no general section', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce({ id: 'default' });
      const result = await service.getGeneralSettings();
      expect(result).toEqual({});
    });
  });

  describe('getPricingSettings', () => {
    it('should return pricing section', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      const result = await service.getPricingSettings();
      expect(result.vatDefaultPct).toBe(21);
    });
  });

  describe('getPosSettings', () => {
    it('should return pos section', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      const result = await service.getPosSettings();
      expect(result.allowNegativeStock).toBe(false);
    });
  });

  describe('getNotificationSettings', () => {
    it('should return decrypted notification settings', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      const result = await service.getNotificationSettings();
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('enc:secret123');
      expect(result.emailEnabled).toBe(true);
    });
  });

  describe('getStorefrontSettings', () => {
    it('should return storefront settings with catalog defaults', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce({
        ...defaultRow,
        storefront: { enabled: true, hidePrices: true, whatsappNumber: '5491112345678' },
      });
      const result = await service.getStorefrontSettings();
      expect(result.enabled).toBe(true);
      expect(result.hidePrices).toBe(true);
      expect(result.whatsappNumber).toBe('5491112345678');
      expect(result.whatsappMessageTemplate).toContain('{product_name}');
    });
  });

  describe('updateSection', () => {
    it('should update a section and audit the change', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      mockPrismaService.systemSettings.update.mockResolvedValueOnce({ ...defaultRow, pricing: { vatDefaultPct: 10.5 } });

      await service.updateSection('pricing', { vatDefaultPct: 10.5 }, 'user-1');

      expect(mockPrismaService.systemSettings.update).toHaveBeenCalledWith({
        where: { id: 'default' },
        data: { pricing: expect.objectContaining({ vatDefaultPct: 10.5 }) },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          resource: 'SystemSettings',
          module: 'SettingsService',
        }),
      );
    });

    it('should strip masked sentinel values before persisting', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);

      await service.updateSection('notifications', { smtpPass: '••••••••', smtpHost: 'smtp.new.com' }, 'user-1');

      const updateCall = mockPrismaService.systemSettings.update.mock.calls[0][0];
      const persistedNotifications = updateCall.data.notifications;
      expect(persistedNotifications.smtpHost).toBe('smtp.new.com');
      // smtpPass should not be the mask — it should be the encrypted version of existing value
      expect(persistedNotifications.smtpPass).not.toBe('••••••••');
    });

    it('should sanitize NaN and null values from the DTO', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);

      await service.updateSection('pricing', { vatDefaultPct: 21, badField: NaN, nullField: null }, 'user-1');

      const updateCall = mockPrismaService.systemSettings.update.mock.calls[0][0];
      const persisted = updateCall.data.pricing;
      expect(persisted.vatDefaultPct).toBe(21);
      expect('badField' in persisted).toBe(false);
      expect('nullField' in persisted).toBe(false);
    });

    it('should throw when default row is not found', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(null);
      await expect(service.updateSection('pricing', {}, 'user-1')).rejects.toThrow(
        'SystemSettings default row not found',
      );
    });

    it('should sync general settings to main branch', async () => {
      const branch = { id: 'branch-1', isMain: true, name: 'Old', settings: {} };
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);
      mockPrismaService.branch.findFirst.mockResolvedValueOnce(branch);
      mockPrismaService.branch.update.mockResolvedValueOnce(branch);

      await service.updateSection('general', { companyName: 'New Co', address: '123 St' }, 'user-1');

      expect(mockPrismaService.branch.findFirst).toHaveBeenCalledWith({ where: { isMain: true } });
      expect(mockPrismaService.branch.update).toHaveBeenCalled();
    });
  });

  describe('updateAllSettings', () => {
    it('should bulk update multiple sections', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      mockPrismaService.systemSettings.update.mockResolvedValueOnce(defaultRow);

      await service.updateAllSettings(
        { pricing: { vatDefaultPct: 10 }, pos: { allowNegativeStock: true } } as any,
        'user-1',
      );

      expect(mockPrismaService.systemSettings.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw when default row is not found', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(null);
      await expect(service.updateAllSettings({} as any, 'user-1')).rejects.toThrow(
        'SystemSettings default row not found',
      );
    });
  });

  describe('testAfipConnection', () => {
    it('should return configuration status when AFIP is not configured', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce(defaultRow);
      const result = await service.testAfipConnection();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/no configurado|WSFE/);
    });
  });

  describe('testSmtpConnection', () => {
    it('should return error when smtpHost is missing', async () => {
      const result = await service.testSmtpConnection({});
      expect(result.success).toBe(false);
      expect(result.message).toContain('Host SMTP');
    });
  });

  describe('testSmsConnection', () => {
    it('should return error when smsGatewayUrl is missing', async () => {
      const result = await service.testSmsConnection({});
      expect(result.success).toBe(false);
      expect(result.message).toContain('URL del Gateway SMS');
    });
  });

  describe('testWhatsappConnection', () => {
    it('should return error when evolutionApiUrl is missing', async () => {
      const result = await service.testWhatsappConnection({});
      expect(result.success).toBe(false);
      expect(result.message).toContain('URL de Evolution API');
    });

    it('should return error when apiKey is missing', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce({
        ...defaultRow,
        notifications: { evolutionApiKey: undefined },
      });
      const result = await service.testWhatsappConnection({ evolutionApiUrl: 'http://api.test' });
      expect(result.success).toBe(false);
    });
  });

  describe('testPushConnection', () => {
    it('should return error when fcmServerKey is missing', async () => {
      mockPrismaService.systemSettings.findUnique.mockResolvedValueOnce({
        ...defaultRow,
        notifications: { fcmServerKey: undefined },
      });
      const result = await service.testPushConnection({});
      expect(result.success).toBe(false);
      expect(result.message).toContain('FCM');
    });
  });
});
