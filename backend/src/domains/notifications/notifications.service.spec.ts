import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { NotificationChannel, TemplateKey } from './models/notification.model';

const mockQueue = {
  add: jest.fn<any>().mockResolvedValue({ id: 'job-123' }),
  getJobs: jest.fn<any>().mockResolvedValue([]),
};

const mockPrismaService: any = {
  notificationTemplate: {
    count: jest.fn<any>().mockResolvedValue(1),
    findUnique: jest.fn(),
  },
  notificationLog: {
    create: jest.fn<any>().mockResolvedValue({ id: 'log-123' }),
    findUnique: jest.fn(),
    groupBy: jest.fn<any>().mockResolvedValue([]),
    count: jest.fn<any>().mockResolvedValue(0),
    findMany: jest.fn<any>().mockResolvedValue([]),
  },
};

const mockSettingsService = {
  getNotificationSettings: jest.fn<any>().mockResolvedValue({
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: true,
    pushEnabled: false,
  }),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getQueueToken('notifications_queue'), useValue: mockQueue },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('should enqueue a notification when template is active and channel is enabled', async () => {
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      id: 'tpl-1',
      isActive: true,
    });

    const result = await service.enqueue({
      channel: NotificationChannel.WHATSAPP,
      templateKey: TemplateKey.OTP_CODE,
      recipient: '5491122334455',
      variables: { otpCode: '654321' },
    });

    expect(mockQueue.add).toHaveBeenCalledWith('send_notification', {
      channel: NotificationChannel.WHATSAPP,
      templateKey: TemplateKey.OTP_CODE,
      recipient: '5491122334455',
      variables: { otpCode: '654321' },
      logId: 'log-123',
    });
    expect(result?.id).toBe('job-123');
  });

  it('should skip enqueue when the channel is disabled in settings', async () => {
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      id: 'tpl-1',
      isActive: true,
    });
    mockSettingsService.getNotificationSettings.mockResolvedValueOnce({
      emailEnabled: true,
      whatsappEnabled: false,
      smsEnabled: true,
      pushEnabled: false,
    });

    const result = await service.enqueue({
      channel: NotificationChannel.WHATSAPP,
      templateKey: TemplateKey.OTP_CODE,
      recipient: '5491122334455',
      variables: { otpCode: '654321' },
    });

    expect(result).toBeNull();
    expect(mockQueue.add).not.toHaveBeenCalled();
    expect(mockPrismaService.notificationLog.create).not.toHaveBeenCalled();
  });

  it('should skip enqueue when template is inactive', async () => {
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      id: 'tpl-1',
      isActive: false,
    });

    const result = await service.enqueue({
      channel: NotificationChannel.EMAIL,
      templateKey: TemplateKey.SALE_CONFIRMED,
      recipient: 'cliente@test.com',
      variables: { customerName: 'Ana', orderId: '1', total: '1000' },
    });

    expect(result).toBeNull();
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('should interpolate template preview', async () => {
    const result = await service.previewTemplate({
      event: 'OTP_CODE',
      channel: 'WHATSAPP',
      body: 'Código: {{otpCode}}',
      variables: { otpCode: '123456' },
    });
    expect(result.body).toBe('Código: 123456');
  });

  it('should retry a failed log entry', async () => {
    mockPrismaService.notificationLog.findUnique.mockResolvedValueOnce({
      id: 'log-fail',
      status: 'FAILED',
      event: TemplateKey.OTP_CODE,
      channel: NotificationChannel.WHATSAPP,
      recipient: '5491122334455',
      variables: { otpCode: '999999' },
      referenceId: null,
    });
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      id: 'tpl-1',
      isActive: true,
    });

    const result = await service.retryLog('log-fail');

    expect(result.success).toBe(true);
    expect(mockQueue.add).toHaveBeenCalled();
  });

  it('should expose template variables registry', () => {
    const vars = service.getTemplateVariables();
    expect(vars.OTP_CODE).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'otpCode' })]),
    );
  });
});
