import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class WhatsAppEvolutionService {
  private readonly logger = new Logger(WhatsAppEvolutionService.name);

  // Evolution API configuration from environment
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
      // If we are in mock mode (no Evolution API URL configured), fallback to log mock
      if (this.baseUrl === 'http://localhost:8080' && this.apiKey === 'mock-key') {
        this.logger.log(
          `[WhatsApp Mock] → +${phone}\n` +
          `  Message: "${message}"`
        );
        return { success: true };
      }

      // Production execution: Native fetch (Node.js 18+) avoids external dependencies like Axios
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
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
}
