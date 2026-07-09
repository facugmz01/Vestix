import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * @deprecated Use `domains/sales/mercadopago.service` — this finance-layer stub is not wired to HTTP.
 */
@Injectable()
export class MercadoPagoService {
  private notAvailable(): never {
    throw new BadRequestException(
      'El flujo PaymentIntent de finance no está activo. Use el checkout de storefront o POS con credenciales reales de Mercado Pago.',
    );
  }

  async createPaymentPreference() {
    this.notAvailable();
  }

  async createPosQrOrder() {
    this.notAvailable();
  }

  async verifyPaymentNotification() {
    this.notAvailable();
  }
}
