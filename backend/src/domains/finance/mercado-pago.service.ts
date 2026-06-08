import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  // In production, we instantiate the official SDK:
  // import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
  // private mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

  /**
   * E-COMMERCE: Generates a hosted payment link (Preference ID)
   */
  async createPaymentPreference(payload: {
    orderId: string;
    amount: number;
    title: string;
    customerEmail?: string;
  }) {
    try {
      // MOCK: In production, this POSTs to api.mercadopago.com
      // const preference = await new Preference(this.mpClient).create({ body: { items: [...], external_reference: payload.orderId } });
      
      const mockMpPreferenceId = `MP-PREF-${crypto.randomUUID()}`;
      
      return {
        externalReferenceId: mockMpPreferenceId,
        checkoutUrl: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mockMpPreferenceId}`,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to communicate with MercadoPago API.');
    }
  }

  /**
   * RETAIL POS: Generates a dynamic QR code payload for physical store screens.
   */
  async createPosQrOrder(payload: {
    posId: string; // Which physical register screen to cast to
    orderId: string;
    amount: number;
    title: string;
  }) {
    // Sends the order directly to the physical MP Smart POS terminal.
    const mockQrData = `00020101021243650016COM.MERCADOPAGO...${payload.orderId}`;
    
    return {
      externalReferenceId: `MP-QR-${crypto.randomUUID()}`,
      qrCodeData: mockQrData
    };
  }

  /**
   * WEBHOOKS: Verifies the cryptographic payload sent by MP to our servers.
   */
  async verifyPaymentNotification(paymentId: string) {
    // MOCK: Calls MP API to ensure a hacker didn't fake the webhook
    // const payment = await new Payment(this.mpClient).get({ id: paymentId });
    
    return {
      status: 'approved',
      orderId: 'MOCK-ORDER-ID', // Normally extracted from `payment.external_reference`
      amount: 100.00
    };
  }
}
