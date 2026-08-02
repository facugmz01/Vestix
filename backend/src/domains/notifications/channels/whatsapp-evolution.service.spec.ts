import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { WhatsAppEvolutionService } from './whatsapp-evolution.service';
import { SettingsService } from '../../../modules/settings/settings.service';

const mockSettings = {
  evolutionApiUrl: 'http://evolution.test',
  evolutionApiKey: 'test-api-key',
  evolutionInstance: 'store-main',
};

const mockSettingsService = {
  getNotificationSettings: jest.fn().mockResolvedValue(mockSettings),
};

describe('WhatsAppEvolutionService', () => {
  let service: WhatsAppEvolutionService;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as any;
    mockSettingsService.getNotificationSettings.mockResolvedValue(mockSettings);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppEvolutionService,
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get(WhatsAppEvolutionService);
    process.env.BACKEND_URL = 'https://api.test.com';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('builds webhook URL from BACKEND_URL', () => {
    expect(service.getWebhookUrl()).toBe(
      'https://api.test.com/api/notifications/whatsapp/webhook',
    );
  });

  it('sendText normalizes AR numbers, checks WA existence, then sends v2 payload', async () => {
    (global.fetch as jest.Mock)
      // connectionState
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ instance: { state: 'open' } }),
      })
      // whatsappNumbers check
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              exists: true,
              jid: '5491122334455@s.whatsapp.net',
              number: '541122334455',
            },
          ]),
      })
      // sendText
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '{"key":{"id":"abc"},"status":"PENDING"}',
      });

    await service.sendText('541122334455', 'Hola');

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://evolution.test/chat/whatsappNumbers/store-main',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ numbers: ['5491122334455', '541122334455'] }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      'http://evolution.test/message/sendText/store-main',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ number: '5491122334455', text: 'Hola' }),
      }),
    );
  });

  it('sendText fails when number has no WhatsApp', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ instance: { state: 'open' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ exists: false, number: '5491122334455' }]),
      });

    await expect(service.sendText('5491122334455', 'Hola')).rejects.toThrow(
      /no tiene WhatsApp/,
    );
  });

  it('sendText throws plain Error when not configured', async () => {
    mockSettingsService.getNotificationSettings.mockImplementationOnce(async () => ({
      evolutionApiUrl: '',
      evolutionApiKey: '',
      evolutionInstance: 'store-main',
    }));

    await expect(service.sendText('5491', 'test')).rejects.toThrow('Evolution API not configured');
  });

  it('getStatus returns not_configured when URL/key missing', async () => {
    mockSettingsService.getNotificationSettings.mockResolvedValueOnce({
      evolutionApiUrl: '',
      evolutionApiKey: '',
      evolutionInstance: 'store-main',
    });

    const status = await service.getStatus();
    expect(status).toMatchObject({
      isReady: false,
      state: 'not_configured',
      configured: false,
    });
  });

  it('getStatus returns QR when instance is connecting', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ instance: { state: 'connecting' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ instance: { state: 'connecting' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          base64: 'iVBORw0KGgo=',
          instance: { state: 'connecting' },
        }),
      });

    const status = await service.getStatus();
    expect(status.isReady).toBe(false);
    expect(status.qrCode).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(status.configured).toBe(true);
  });

  it('ensureInstance creates instance when connectionState returns 404', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'not found',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({
          instance: { status: 'connecting' },
          qrcode: { base64: 'data:image/png;base64,abc' },
        }),
      });

    const result = await service.ensureInstance();
    expect(result.created).toBe(true);
    expect(result.qrCode).toBe('data:image/png;base64,abc');

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://evolution.test/instance/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          instanceName: 'store-main',
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
        }),
      }),
    );
  });

  it('configureWebhook posts webhook/set with delivery events', async () => {
    process.env.EVOLUTION_WEBHOOK_SECRET = 'wh-secret';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '{"webhook":{}}',
    });

    const result = await service.configureWebhook();
    expect(result.success).toBe(true);
    expect(result.url).toContain('/api/notifications/whatsapp/webhook');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.webhook.enabled).toBe(true);
    expect(body.webhook.events).toEqual(['MESSAGES_UPDATE', 'SEND_MESSAGE']);
    expect(body.webhook.headers).toEqual({ apikey: 'wh-secret' });
  });

  it('connect returns ready status without fetching QR when already open', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ instance: { state: 'open' } }),
    });

    const status = await service.connect();
    expect(status.isReady).toBe(true);
    expect(status.qrCode).toBeNull();
  });
});
