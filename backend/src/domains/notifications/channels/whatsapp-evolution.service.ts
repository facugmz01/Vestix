import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SettingsService } from '../../../modules/settings/settings.service';

@Injectable()
export class WhatsAppEvolutionService {
  private readonly logger = new Logger(WhatsAppEvolutionService.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Reads Evolution API config from SystemSettings via SettingsService (cached + decrypted).
   */
  private async getConfig() {
    const n = await this.settingsService.getNotificationSettings();
    return {
      baseUrl: n.evolutionApiUrl || '',
      apiKey: n.evolutionApiKey || '',
      instance: n.evolutionInstance || 'store-main',
    };
  }

  /**
   * Sends a plain text WhatsApp message to a given phone number.
   * Phone must be in international format without '+': e.g. 5491122334455
   */
  async sendText(phone: string, message: string) {
    const { baseUrl, apiKey, instance } = await this.getConfig();

    if (!baseUrl || !apiKey) {
      this.logger.warn(`[WhatsApp] Cannot send message to ${phone}. Evolution API URL/Key not configured.`);
      return { success: false, error: 'Evolution API not configured' };
    }

    const endpoint = `${baseUrl.replace(/\/+$/, '')}/message/sendText/${instance}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: phone,
          textMessage: { text: message },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API responded with status ${response.status}: ${errorText}`);
      }

      this.logger.log(`[WhatsApp] ✓ Message sent successfully to +${phone}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`[WhatsApp] Failed to send to ${phone}: ${err.message}`);
      throw new InternalServerErrorException(`WhatsApp delivery failed: ${err.message}`);
    }
  }

  async getStatus() {
    const { baseUrl, apiKey, instance } = await this.getConfig();

    if (!baseUrl || !apiKey) {
      return { isReady: false, qrCode: null };
    }

    const endpoint = `${baseUrl.replace(/\/+$/, '')}/instance/connectionState/${instance}`;
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });

      if (!response.ok) {
        return { isReady: false, qrCode: null };
      }

      const data = await response.json() as any;
      const isReady = data?.instance?.state === 'open';
      return { isReady, qrCode: null };
    } catch (err: any) {
      this.logger.error(`[WhatsApp] Failed to fetch connection status: ${err.message}`);
      return { isReady: false, qrCode: null };
    }
  }
}
