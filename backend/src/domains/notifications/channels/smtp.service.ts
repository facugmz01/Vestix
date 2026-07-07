import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../../../modules/settings/settings.service';

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Dispatches an email with plain text + simple HTML body.
   */
  async send(to: string, subject: string, body: string) {
    const notificationsConfig = await this.settingsService.getNotificationSettings();
    const smtpHost = notificationsConfig.smtpHost || process.env.SMTP_HOST;
    const smtpPort = notificationsConfig.smtpPort?.toString() || process.env.SMTP_PORT;
    const smtpUser = notificationsConfig.smtpUser || process.env.SMTP_USER;
    const smtpPass = notificationsConfig.smtpPass || process.env.SMTP_PASS;
    const storeName = process.env.STORE_NAME || 'Vestix ERP';

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort ? parseInt(smtpPort, 10) : 587,
          secure: smtpPort === '465',
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: `"${storeName}" <${smtpUser}>`,
          to,
          subject,
          text: body,
          html: this.toHtml(body),
        });

        this.logger.log(`[SMTP] ✓ Real email sent to ${to} | Subject: "${subject}"`);
        return { success: true };
      } catch (err: any) {
        this.logger.error(`[SMTP] Failed to send real email to ${to}: ${err.message}`);
        throw err;
      }
    }

    this.logger.log(
      `[SMTP Mock] → Recipient: ${to}\n` +
      `  Subject: "${subject}"\n` +
      `  Body: "${body.replace(/\n/g, ' ')}"`,
    );
    return { success: true };
  }

  private toHtml(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#222">${escaped.replace(/\n/g, '<br>')}</body></html>`;
  }
}
