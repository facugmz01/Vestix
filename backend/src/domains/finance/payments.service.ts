import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentProvider } from './models/payment.model';

const DEPRECATED_MESSAGE =
  'El flujo PaymentIntent de finance no está activo. Use el checkout de storefront (/api/storefront/checkout) o POS con credenciales reales de Mercado Pago.';

/**
 * @deprecated Superseded by StorefrontController + MercadoPagoService in domains/sales.
 * Kept registered in FinanceModule for backwards compatibility; all entry points reject calls.
 */
@Injectable()
export class PaymentsService {
  async createOnlinePayment(
    _orderId: string,
    _amount: number,
    _title: string,
    _provider: PaymentProvider,
  ): Promise<{ intentId: string; checkoutUrl: string }> {
    throw new BadRequestException(DEPRECATED_MESSAGE);
  }

  async handleWebhook(_provider: PaymentProvider, _payload: unknown): Promise<{ status: string }> {
    throw new BadRequestException(DEPRECATED_MESSAGE);
  }
}
