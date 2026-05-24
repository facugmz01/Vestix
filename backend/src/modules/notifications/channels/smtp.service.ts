import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);

  /**
   * Dispatches an email.
   * If SMTP host and credentials are set in the environment variables, it uses
   * nodemailer to send a real email. Otherwise, it falls back to a clean mock logger.
   */
  async send(to: string, subject: string, body: string) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const storeName = process.env.STORE_NAME || 'Vestix ERP';

    if (smtpHost && smtpUser && smtpPass) {
      try {
        // Dynamic import to prevent compilation errors if nodemailer is not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort ? parseInt(smtpPort, 10) : 587,
          secure: smtpPort === '465',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"${storeName}" <${smtpUser}>`,
          to,
          subject,
          text: body,
        });

        this.logger.log(`[SMTP] ✓ Real email sent to ${to} | Subject: "${subject}"`);
        return { success: true };
      } catch (err: any) {
        this.logger.error(`[SMTP] Failed to send real email to ${to}: ${err.message}`);
        throw err;
      }
    } else {
      // Mock Fallback in development
      this.logger.log(
        `[SMTP Mock] → Recipient: ${to}\n` +
        `  Subject: "${subject}"\n` +
        `  Body: "${body.replace(/\n/g, ' ')}"`
      );
      return { success: true };
    }
  }
}
