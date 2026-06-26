import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SettingsService } from '../../../modules/settings/settings.service';

@Injectable()
export class WhatsAppOpenWaService {
  private readonly logger = new Logger(WhatsAppOpenWaService.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Sends a plain text WhatsApp message to a given phone number via external OpenWA URL.
   * Phone must be in international format without '+': e.g. 5491122334455
   */
  async sendText(phone: string, message: string, isOtp = false) {
    const notificationsConfig = (await this.settingsService.getNotificationSettings()) as any;
    
    const openWaUrl = isOtp ? (notificationsConfig.openWaOtpUrl || notificationsConfig.openWaUrl) : notificationsConfig.openWaUrl;
    const session = isOtp ? (notificationsConfig.openWaOtpSession || notificationsConfig.openWaSession || 'default') : (notificationsConfig.openWaSession || 'default');

    if (!openWaUrl) {
      this.logger.warn(`[OpenWA] Cannot send message to ${phone}. No URL configured.`);
      return { success: false, error: 'OpenWA URL not configured' };
    }

    try {
      const formattedNumber = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      
      // Typical OpenWA API endpoint for sending text
      // POST {url}/api/sendText
      await axios.post(`${openWaUrl.replace(/\/+$/, '')}/api/sendText`, {
        session,
        chatId: formattedNumber,
        text: message,
      }, { timeout: 15000 });

      this.logger.log(`[WhatsApp] ✓ Message sent successfully to +${phone} via ${openWaUrl}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`[WhatsApp] Failed to send to ${phone}: ${err.message}`);
      throw err;
    }
  }

  async getStatus() {
    const notificationsConfig = (await this.settingsService.getNotificationSettings()) as any;
    const openWaUrl = notificationsConfig.openWaUrl;
    
    if (!openWaUrl) {
      return { isReady: false, qrCode: null };
    }

    try {
      const session = notificationsConfig.openWaSession || 'default';
      const res = await axios.get(`${openWaUrl.replace(/\/+$/, '')}/api/sessions/status/${session}`);
      // OpenWA usually returns { state: "CONNECTED" } or similar
      const isReady = res.data?.state === 'CONNECTED';
      return { isReady, qrCode: null }; // Getting the actual QR code from HTTP is implementation-specific in OpenWA, assuming null for now.
    } catch (err) {
      return { isReady: false, qrCode: null };
    }
  }
}
