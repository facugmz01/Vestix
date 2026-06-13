import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentIntent, PaymentProvider, PaymentIntentStatus } from './models/payment.model';
import { MercadoPagoService } from './mercado-pago.service';
import { OrdersFulfillmentService } from '../sales/orders/orders-fulfillment.service';
import { AccountsService } from './accounts.service';
import * as crypto from 'crypto';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mpService: MercadoPagoService,
    private readonly ordersService: OrdersFulfillmentService,
    private readonly accountsService: AccountsService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * 1. INITIATION: User clicks "Pay" on the E-commerce cart.
   * We generate an Intent to track the attempt and return the external MP URL.
   */
  async createOnlinePayment(orderId: string, amount: number, title: string, provider: PaymentProvider) {
    let externalRef = '';
    let checkoutUrl = '';

    if (provider === PaymentProvider.MERCADO_PAGO) {
      const mpResponse = await this.mpService.createPaymentPreference({ orderId, amount, title });
      externalRef = mpResponse.externalReferenceId;
      checkoutUrl = mpResponse.checkoutUrl;
    } else {
      throw new BadRequestException(`Provider ${provider} is not supported yet.`);
    }

    const intent = await this.prisma.paymentIntent.create({
      data: {
        id: crypto.randomUUID(),
        provider,
        externalReferenceId: externalRef,
        orderId,
        amount,
        currency: 'ARS', // Default for MercadoPago Argentina
        status: PaymentIntentStatus.CREATED,
      }
    });

    return { intentId: intent.id, checkoutUrl };
  }

  /**
   * 2. RESOLUTION: MercadoPago servers ping our Webhook URL in the background.
   */
  async handleWebhook(provider: PaymentProvider, payload: any) {
    if (provider === PaymentProvider.MERCADO_PAGO) {
      
      // 1. Authenticate the payload with MP directly
      const verification = await this.mpService.verifyPaymentNotification(payload.data.id);
      
      if (verification.status === 'approved') {
        // 2. Find our internal tracking Intent
        const intent = await this.prisma.paymentIntent.findFirst({
          where: { orderId: verification.orderId }
        });
        if (!intent) throw new NotFoundException('Payment Intent not found for this order.');
        
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: PaymentIntentStatus.APPROVED }
        });

        // 3. LOGISTICS GATEWAY: Tell the Warehouse to start picking the order
        await this.ordersService.markAsPaid(intent.orderId);

        // 4. TREASURY GATEWAY: Deposit the virtual funds into the Double-Entry Accounts Ledger
        await this.accountsService.generateIncomingReceipt({
          accountId: 'VIRTUAL-MP-ACCOUNT-ID', // Internal representation of the MP clearing house
          amount: verification.amount,
          payerName: 'MercadoPago Auto-Clearing',
          referenceId: intent.id,
          description: `Online Payment Cleared for Order ${intent.orderId}`
        });

        return { status: 'SUCCESS' };
      }
    }
  }
}
