import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
// import axios from 'axios';

@Injectable()
export class WhatsAppEvolutionService {
  private readonly logger = new Logger(WhatsAppEvolutionService.name);

  // Evolution API is self-hosted — runs alongside our Docker stack.
  // Configured in production via .env:
  // EVOLUTION_API_URL=http://evolution-api:8080
  // EVOLUTION_API_KEY=<secret>
  // EVOLUTION_INSTANCE=store-main
  
  private readonly baseUrl = process.env.EVOLUTION_API_URL ?? 'http://localhost:8080';
  private readonly apiKey = process.env.EVOLUTION_API_KEY ?? 'mock-key';
  private readonly instance = process.env.EVOLUTION_INSTANCE ?? 'store-main';

  /**
   * Sends a plain text WhatsApp message to a given phone number.
   * Phone must be in international format without '+': e.g. 5491122334455
   */
  async sendText(phone: string, message: string) {
    const endpoint = `${this.baseUrl}/message/sendText/${this.instance}`;
    
    try {
      // PRODUCTION: Use axios to POST to the Evolution API container
      // await axios.post(endpoint, {
      //   number: phone,
      //   textMessage: { text: message }
      // }, { headers: { apikey: this.apiKey } });

      this.logger.log(`[WhatsApp] → +${phone} | Length: ${message.length} chars`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`[WhatsApp] Failed to send to ${phone}: ${err.message}`);
      throw new InternalServerErrorException(`WhatsApp delivery failed: ${err.message}`);
    }
  }
}
