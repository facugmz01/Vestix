import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../../../modules/settings/settings.service';

@Injectable()
export class FcmPushService {
  private readonly logger = new Logger(FcmPushService.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Sends a push notification via FCM Legacy HTTP API.
   * @param deviceToken FCM registration token
   */
  async send(deviceToken: string, title: string, body: string, data?: Record<string, string>) {
    const settings = await this.settingsService.getNotificationSettings();
    const serverKey = settings.fcmServerKey;

    if (!serverKey) {
      this.logger.warn('[FCM] Server key not configured');
      throw new Error('FCM Server Key not configured');
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: deviceToken,
        notification: { title, body },
        data: data ?? {},
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 401) {
      throw new Error('FCM Server Key inválida');
    }

    const result = await response.json().catch(() => ({})) as any;
    if (!response.ok || result.failure > 0) {
      const errMsg = result.results?.[0]?.error || `FCM HTTP ${response.status}`;
      throw new Error(`FCM delivery failed: ${errMsg}`);
    }

    this.logger.log(`[FCM] ✓ Push sent to token …${deviceToken.slice(-8)}`);
    return { success: true };
  }
}
