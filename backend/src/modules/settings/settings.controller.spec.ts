import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

const mockSettingsService: any = {
  getSettings: jest.fn(),
  updateSection: jest.fn(),
  updateAllSettings: jest.fn(),
  testAfipConnection: jest.fn(),
  testSmtpConnection: jest.fn(),
  testSmsConnection: jest.fn(),
  testWhatsappConnection: jest.fn(),
  testPushConnection: jest.fn(),
};

describe('SettingsController', () => {
  let controller: SettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: mockSettingsService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SettingsController>(SettingsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should delegate to settingsService.getSettings', async () => {
      const expected = { general: { companyName: 'Vestix' } };
      mockSettingsService.getSettings.mockResolvedValueOnce(expected);
      const result = await controller.getSettings();
      expect(result).toEqual(expected);
    });
  });

  describe('patchSection', () => {
    const req = { user: { userId: 'u1' } };

    it('should reject invalid section names', async () => {
      await expect(controller.patchSection('invalid', {}, req)).rejects.toThrow(BadRequestException);
    });

    it('should update a valid section', async () => {
      const updated = { general: { companyName: 'NewCo' } };
      mockSettingsService.updateSection.mockResolvedValueOnce(updated);
      const result = await controller.patchSection('general', { companyName: 'NewCo' }, req);
      expect(mockSettingsService.updateSection).toHaveBeenCalledWith('general', { companyName: 'NewCo' }, 'u1');
      expect(result).toEqual(updated);
    });

    it('should use "unknown" when req.user is missing', async () => {
      mockSettingsService.updateSection.mockResolvedValueOnce({});
      await controller.patchSection('pricing', { vatDefaultPct: 10 }, {});
      expect(mockSettingsService.updateSection).toHaveBeenCalledWith('pricing', { vatDefaultPct: 10 }, 'unknown');
    });
  });

  describe('updateAllSettings', () => {
    it('should delegate to settingsService.updateAllSettings', async () => {
      const dto = { pricing: { vatDefaultPct: 10 } };
      const req = { user: { userId: 'u1' } };
      mockSettingsService.updateAllSettings.mockResolvedValueOnce({});
      await controller.updateAllSettings(dto as any, req);
      expect(mockSettingsService.updateAllSettings).toHaveBeenCalledWith(dto, 'u1');
    });
  });

  describe('testAfipConnection', () => {
    it('should delegate to service', async () => {
      mockSettingsService.testAfipConnection.mockResolvedValueOnce({ success: false });
      const result = await controller.testAfipConnection();
      expect(result).toEqual({ success: false });
    });
  });

  describe('testSmtpConnection', () => {
    it('should delegate to service', async () => {
      mockSettingsService.testSmtpConnection.mockResolvedValueOnce({ success: true });
      const result = await controller.testSmtpConnection({ smtpHost: 'smtp.test.com' } as any);
      expect(mockSettingsService.testSmtpConnection).toHaveBeenCalledWith({ smtpHost: 'smtp.test.com' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('testSmsConnection', () => {
    it('should delegate to service', async () => {
      mockSettingsService.testSmsConnection.mockResolvedValueOnce({ success: true });
      await controller.testSmsConnection({ smsGatewayUrl: 'http://sms.test' } as any);
      expect(mockSettingsService.testSmsConnection).toHaveBeenCalled();
    });
  });

  describe('testWhatsappConnection', () => {
    it('should delegate to service', async () => {
      mockSettingsService.testWhatsappConnection.mockResolvedValueOnce({ success: true });
      await controller.testWhatsappConnection({ evolutionApiUrl: 'http://wa.test' } as any);
      expect(mockSettingsService.testWhatsappConnection).toHaveBeenCalled();
    });
  });

  describe('testPushConnection', () => {
    it('should delegate to service', async () => {
      mockSettingsService.testPushConnection.mockResolvedValueOnce({ success: true });
      await controller.testPushConnection({ fcmServerKey: 'key' } as any);
      expect(mockSettingsService.testPushConnection).toHaveBeenCalled();
    });
  });

  describe('uploadLogo', () => {
    it('should throw BadRequestException when no file uploaded', async () => {
      const req = { user: { userId: 'u1' } };
      await expect(controller.uploadLogo(undefined as any, req)).rejects.toThrow(BadRequestException);
    });

    it('should return logoUrl on successful upload', async () => {
      mockSettingsService.updateSection.mockResolvedValueOnce({});
      const file = { filename: 'logo-123.png' } as any;
      const req = { user: { userId: 'u1' } };
      const result = await controller.uploadLogo(file, req);
      expect(result).toEqual({ logoUrl: '/uploads/logos/logo-123.png' });
      expect(mockSettingsService.updateSection).toHaveBeenCalledWith(
        'general',
        { logoUrl: '/uploads/logos/logo-123.png' },
        'u1',
      );
    });
  });
});
