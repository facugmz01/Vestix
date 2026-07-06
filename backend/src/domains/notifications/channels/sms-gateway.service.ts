import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SettingsService } from '../../../modules/settings/settings.service';

@Injectable()
export class SmsGatewayService {
  private readonly logger = new Logger(SmsGatewayService.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Sends an SMS via the configured Android SMS Gateway URL.
   */
  async sendSms(phone: string, message: string) {
    const notificationsConfig = await this.settingsService.getNotificationSettings();
    const url = notificationsConfig.smsGatewayUrl;

    if (!url) {
      this.logger.warn(`[SMS Gateway] Cannot send SMS to +${phone}. No URL configured.`);
      throw new Error('No SMS Gateway URL configured');
    }

    try {
      this.logger.log(`[SMS Gateway] Sending SMS to +${phone} via ${url}...`);
      await axios.post(url, {
        to: phone,
        message,
      }, { timeout: 10000 });
      
      this.logger.log(`[SMS Gateway] ✓ SMS successfully handed off to gateway (+${phone}).`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`[SMS Gateway] Failed to send SMS to +${phone}: ${err.message}`);
      throw err;
    }
  }
}
