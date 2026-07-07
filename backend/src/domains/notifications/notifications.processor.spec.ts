import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProcessor } from './notifications.processor';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { SmsGatewayService } from './channels/sms-gateway.service';
import { FcmPushService } from './channels/fcm-push.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationChannel } from './models/notification.model';

const mockSmtpService = {
  send: jest.fn<any>().mockResolvedValue({ success: true }),
};

const mockWhatsAppService = {
  sendText: jest.fn<any>().mockResolvedValue({ success: true }),
};

const mockSmsService = {
  sendSms: jest.fn<any>().mockResolvedValue({ success: true }),
};

const mockFcmService = {
  send: jest.fn<any>().mockResolvedValue({ success: true }),
};

const mockPrismaService: any = {
  notificationTemplate: {
    findUnique: jest.fn(),
  },
  notificationLog: {
    update: jest.fn<any>().mockResolvedValue({}),
  },
};

describe('NotificationsProcessor', () => {
  let processor: NotificationsProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsProcessor,
        { provide: SmtpService, useValue: mockSmtpService },
        { provide: WhatsAppEvolutionService, useValue: mockWhatsAppService },
        { provide: SmsGatewayService, useValue: mockSmsService },
        { provide: FcmPushService, useValue: mockFcmService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    processor = module.get(NotificationsProcessor);
  });

  const baseJob = {
    id: 'job-1',
    data: {
      channel: NotificationChannel.WHATSAPP,
      templateKey: 'OTP_CODE',
      recipient: '5491122334455',
      variables: { otpCode: '123456' },
      logId: 'log-1',
    },
  };

  it('should interpolate variables and send WhatsApp messages', async () => {
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      body: 'Código: {{otpCode}}',
      subject: null,
    });

    await processor.process(baseJob as any);

    expect(mockWhatsAppService.sendText).toHaveBeenCalledWith('5491122334455', 'Código: 123456');
    expect(mockPrismaService.notificationLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: { status: 'SENT', sentAt: expect.any(Date) },
    });
  });

  it('should send SMTP emails with interpolated subject and body', async () => {
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      body: 'Hola {{customerName}}',
      subject: 'Pedido {{orderId}}',
    });

    await processor.process({
      ...baseJob,
      data: {
        ...baseJob.data,
        channel: NotificationChannel.EMAIL,
        templateKey: 'SALE_CONFIRMED',
        recipient: 'cliente@test.com',
        variables: { customerName: 'Ana', orderId: '1001' },
      },
    } as any);

    expect(mockSmtpService.send).toHaveBeenCalledWith(
      'cliente@test.com',
      'Pedido 1001',
      'Hola Ana',
    );
  });

  it('should fail the log and throw when WhatsApp is not configured', async () => {
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      body: 'Código: {{otpCode}}',
      subject: null,
    });
    mockWhatsAppService.sendText.mockRejectedValueOnce(new Error('Evolution API not configured'));

    await expect(processor.process(baseJob as any)).rejects.toThrow('Evolution API not configured');

    expect(mockPrismaService.notificationLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: { status: 'FAILED', errorMessage: 'Evolution API not configured' },
    });
  });

  it('should send PUSH notifications via FCM', async () => {
    mockPrismaService.notificationTemplate.findUnique.mockResolvedValueOnce({
      name: 'Push Alert',
      body: 'Hola {{customerName}}',
      subject: 'Aviso',
    });

    await processor.process({
      ...baseJob,
      data: {
        ...baseJob.data,
        channel: NotificationChannel.PUSH,
        templateKey: 'LOW_STOCK_ALERT',
        recipient: 'fcm-device-token-abc',
        variables: { customerName: 'Admin' },
      },
    } as any);

    expect(mockFcmService.send).toHaveBeenCalledWith(
      'fcm-device-token-abc',
      'Aviso',
      'Hola Admin',
      expect.objectContaining({ event: 'LOW_STOCK_ALERT' }),
    );
  });
});
