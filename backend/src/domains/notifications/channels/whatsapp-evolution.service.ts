import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SettingsService } from '../../../modules/settings/settings.service';
import { normalizeWhatsAppPhone, phoneFromWhatsAppJid } from '../utils/phone.util';

export interface EvolutionStatus {
  isReady: boolean;
  state: string;
  qrCode: string | null;
  instance: string;
  webhookUrl: string;
  configured: boolean;
}

@Injectable()
export class WhatsAppEvolutionService {
  private readonly logger = new Logger(WhatsAppEvolutionService.name);

  constructor(private readonly settingsService: SettingsService) {}

  private async getConfig() {
    const n = await this.settingsService.getNotificationSettings();
    return {
      baseUrl: n.evolutionApiUrl || '',
      apiKey: n.evolutionApiKey || '',
      instance: n.evolutionInstance || 'store-main',
    };
  }

  getWebhookUrl(): string {
    const base = (
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3001'
    ).replace(/\/+$/, '');
    return `${base}/api/notifications/whatsapp/webhook`;
  }

  private async evolutionFetch<T = any>(
    path: string,
    options: RequestInit = {},
    configOverride?: { baseUrl: string; apiKey: string; instance: string },
  ): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
    const config = configOverride ?? await this.getConfig();
    const { baseUrl, apiKey } = config;
    if (!baseUrl || !apiKey) {
      throw new Error('Evolution API not configured');
    }

    const url = `${baseUrl.replace(/\/+$/, '')}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
        ...(options.headers ?? {}),
      },
    });

    const text = await response.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = null;
      }
    }

    return { ok: response.ok, status: response.status, data, text };
  }

  private normalizeQrCode(raw: unknown): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image')) return trimmed;
    return `data:image/png;base64,${trimmed}`;
  }

  private extractQrFromResponse(data: any): string | null {
    if (!data || typeof data !== 'object') return null;
    return (
      this.normalizeQrCode(data.base64) ||
      this.normalizeQrCode(data.qrcode?.base64) ||
      this.normalizeQrCode(data.qrCode?.base64) ||
      this.normalizeQrCode(data.qr?.base64)
    );
  }

  private extractConnectionState(data: any): string {
    return (
      data?.instance?.state ||
      data?.instance?.status ||
      data?.state ||
      data?.status ||
      'unknown'
    ).toString().toLowerCase();
  }

  /**
   * Resolve the WhatsApp JID/number Evolution will actually deliver to.
   * Fixes AR numbers missing the mobile "9" that otherwise appear in Manager but never reach the phone.
   */
  async resolveWhatsAppNumber(
    phone: string,
    configOverride?: { baseUrl: string; apiKey: string; instance: string },
  ): Promise<string> {
    const normalized = normalizeWhatsAppPhone(phone);
    if (!normalized) {
      throw new Error(`Invalid phone number: ${phone}`);
    }

    const config = configOverride ?? await this.getConfig();
    const candidates = Array.from(
      new Set(
        [
          normalized,
          // Also try without forcing 9 in case the check endpoint corrects it
          phone.replace(/\D/g, ''),
        ].filter((n) => n && n.length >= 8),
      ),
    );

    try {
      const result = await this.evolutionFetch<Array<{
        exists?: boolean;
        jid?: string;
        number?: string;
      }>>(
        `/chat/whatsappNumbers/${config.instance}`,
        {
          method: 'POST',
          body: JSON.stringify({ numbers: candidates }),
        },
        config,
      );

      if (result.ok && Array.isArray(result.data)) {
        const hit = result.data.find((row) => row?.exists);
        if (hit) {
          const resolved =
            phoneFromWhatsAppJid(hit.jid) ||
            normalizeWhatsAppPhone(hit.number) ||
            normalized;
          if (resolved !== normalized) {
            this.logger.log(
              `[WhatsApp] Number resolved ${normalized} → ${resolved} (via Evolution check)`,
            );
          }
          return resolved;
        }

        const anyRow = result.data[0];
        if (anyRow && anyRow.exists === false) {
          throw new Error(
            `El número +${normalized} no tiene WhatsApp (Evolution check).`,
          );
        }
      } else if (!result.ok) {
        this.logger.warn(
          `[WhatsApp] Number check unavailable (HTTP ${result.status}); sending to normalized ${normalized}`,
        );
      }
    } catch (err: any) {
      if (String(err.message || '').includes('no tiene WhatsApp')) {
        throw err;
      }
      this.logger.warn(
        `[WhatsApp] Number check failed (${err.message}); sending to normalized ${normalized}`,
      );
    }

    return normalized;
  }

  /**
   * Sends a plain text WhatsApp message (Evolution API v2 format).
   * Phone is normalized to AR WhatsApp form (549…) and verified when possible.
   */
  async sendText(phone: string, message: string) {
    let target = phone;
    try {
      const config = await this.getConfig();
      if (!config.baseUrl || !config.apiKey) {
        this.logger.warn(`[WhatsApp] Cannot send message to ${phone}. Evolution API URL/Key not configured.`);
        throw new Error('Evolution API not configured');
      }

      const { state, isReady } = await this.getConnectionState();
      if (!isReady) {
        throw new Error(
          `WhatsApp session not connected (state: ${state}). Escaneá el QR en Evolution Manager.`,
        );
      }

      target = await this.resolveWhatsAppNumber(phone, config);

      const result = await this.evolutionFetch(
        `/message/sendText/${config.instance}`,
        {
          method: 'POST',
          body: JSON.stringify({ number: target, text: message }),
        },
        config,
      );

      if (!result.ok) {
        throw new Error(
          `Evolution API responded with status ${result.status}: ${result.text}`,
        );
      }

      const status = (result.data as any)?.status?.toString?.().toUpperCase?.() || '';
      if (status === 'ERROR') {
        throw new Error(`Evolution API marked message as ERROR for +${target}`);
      }

      this.logger.log(`[WhatsApp] ✓ Message accepted by Evolution for +${target} (status: ${status || 'ok'})`);
      return { success: true, recipient: target };
    } catch (err: any) {
      if (err.message === 'Evolution API not configured') {
        this.logger.warn(`[WhatsApp] Cannot send message to ${phone}. Evolution API URL/Key not configured.`);
        throw err;
      }
      this.logger.error(`[WhatsApp] Failed to send to ${target}: ${err.message}`);
      throw new InternalServerErrorException(`WhatsApp delivery failed: ${err.message}`);
    }
  }

  async getConnectionState(): Promise<{ state: string; isReady: boolean }> {
    const { instance } = await this.getConfig();

    try {
      const result = await this.evolutionFetch(`/instance/connectionState/${instance}`);
      if (!result.ok) {
        return { state: 'unreachable', isReady: false };
      }
      const state = this.extractConnectionState(result.data);
      return { state, isReady: state === 'open' };
    } catch (err: any) {
      this.logger.error(`[WhatsApp] Failed to fetch connection state: ${err.message}`);
      return { state: 'error', isReady: false };
    }
  }

  /**
   * Creates the Evolution instance if it does not exist yet.
   */
  async ensureInstance(): Promise<{ created: boolean; state: string; qrCode: string | null }> {
    const { instance } = await this.getConfig();

    const existing = await this.evolutionFetch(`/instance/connectionState/${instance}`);
    if (existing.ok) {
      const state = this.extractConnectionState(existing.data);
      return { created: false, state, qrCode: null };
    }

    if (existing.status !== 404) {
      throw new Error(
        `Could not verify instance "${instance}" (HTTP ${existing.status}): ${existing.text}`,
      );
    }

    const created = await this.evolutionFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: instance,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });

    if (!created.ok) {
      throw new Error(
        `Failed to create instance "${instance}" (HTTP ${created.status}): ${created.text}`,
      );
    }

    const state = this.extractConnectionState(created.data);
    const qrCode = this.extractQrFromResponse(created.data);
    this.logger.log(`[WhatsApp] Instance "${instance}" created (state: ${state})`);
    return { created: true, state, qrCode };
  }

  /**
   * Initiates connection and returns QR code when needed.
   */
  async connect(): Promise<EvolutionStatus> {
    const { baseUrl, apiKey, instance } = await this.getConfig();
    if (!baseUrl || !apiKey) {
      return {
        isReady: false,
        state: 'not_configured',
        qrCode: null,
        instance,
        webhookUrl: this.getWebhookUrl(),
        configured: false,
      };
    }

    await this.ensureInstance();

    const { state, isReady } = await this.getConnectionState();
    if (isReady) {
      return this.getStatus();
    }

    const qr = await this.getQrCode();
    return {
      isReady: false,
      state: qr.state,
      qrCode: qr.qrCode,
      instance,
      webhookUrl: this.getWebhookUrl(),
      configured: true,
    };
  }

  /**
   * GET /instance/connect/{instance} — returns QR base64 when pairing is required.
   */
  async getQrCode(): Promise<{ qrCode: string | null; state: string }> {
    const { instance } = await this.getConfig();

    try {
      const { state, isReady } = await this.getConnectionState();
      if (isReady) {
        return { qrCode: null, state };
      }

      const result = await this.evolutionFetch(`/instance/connect/${instance}`);
      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.text}`);
      }

      const nextState = this.extractConnectionState(result.data) || state;
      return {
        qrCode: this.extractQrFromResponse(result.data),
        state: nextState,
      };
    } catch (err: any) {
      this.logger.error(`[WhatsApp] Failed to fetch QR code: ${err.message}`);
      return { qrCode: null, state: 'error' };
    }
  }

  /**
   * Registers delivery webhook on the Evolution instance.
   */
  async configureWebhook(): Promise<{ success: boolean; url: string; message?: string }> {
    const { instance } = await this.getConfig();
    const url = this.getWebhookUrl();
    const secret = process.env.EVOLUTION_WEBHOOK_SECRET;

    const body: Record<string, unknown> = {
      webhook: {
        enabled: true,
        url,
        webhookByEvents: false,
        events: ['MESSAGES_UPDATE', 'SEND_MESSAGE'],
      },
    };

    if (secret) {
      (body.webhook as Record<string, unknown>).headers = { apikey: secret };
    }

    const result = await this.evolutionFetch(`/webhook/set/${instance}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!result.ok) {
      throw new Error(`Webhook setup failed (HTTP ${result.status}): ${result.text}`);
    }

    this.logger.log(`[WhatsApp] Webhook configured for instance "${instance}" → ${url}`);
    return { success: true, url, message: 'Webhook registrado en Evolution API' };
  }

  async getStatus(): Promise<EvolutionStatus> {
    const { baseUrl, apiKey, instance } = await this.getConfig();
    const webhookUrl = this.getWebhookUrl();

    if (!baseUrl || !apiKey) {
      return {
        isReady: false,
        state: 'not_configured',
        qrCode: null,
        instance,
        webhookUrl,
        configured: false,
      };
    }

    const { state, isReady } = await this.getConnectionState();

    if (isReady) {
      return {
        isReady: true,
        state,
        qrCode: null,
        instance,
        webhookUrl,
        configured: true,
      };
    }

    const needsQr = state === 'close' || state === 'connecting' || state === 'unknown';
    const qr = needsQr ? await this.getQrCode() : { qrCode: null, state };

    return {
      isReady: false,
      state: qr.state || state,
      qrCode: qr.qrCode,
      instance,
      webhookUrl,
      configured: true,
    };
  }
}
