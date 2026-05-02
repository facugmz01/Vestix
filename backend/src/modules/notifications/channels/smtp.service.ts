import { Injectable, Logger } from '@nestjs/common';
// import * as nodemailer from 'nodemailer'; // npm install nodemailer

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);

  // In production, configure via @nestjs/config:
  // private transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT),
  //   secure: true,
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });

  async send(to: string, subject: string, body: string) {
    try {
      // MOCK: In production:
      // await this.transporter.sendMail({ from: `"${process.env.STORE_NAME}" <${process.env.SMTP_USER}>`, to, subject, text: body });
      this.logger.log(`[SMTP] → ${to} | Subject: "${subject}"`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`[SMTP] Failed to send to ${to}: ${err.message}`);
      throw err;
    }
  }
}
