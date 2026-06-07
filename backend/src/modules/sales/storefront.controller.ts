import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { SalesService } from './sales.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { StorefrontAuthGuard } from './storefront-auth.guard';
import * as crypto from 'crypto';

// Fixed shipping rates
const SHIPPING_RATES = {
  SHIPPING: 3500,
  PICKUP: 0,
} as const;

@Controller('storefront')
export class StorefrontController {
  private readonly logger = new Logger(StorefrontController.name);

  constructor(
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
    private readonly salesService: SalesService,
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  /**
   * POST /storefront/checkout
   * Creates the order in the ERP (inventory deduction, etc.).
   * Returns the order + a MercadoPago init_point URL for payment.
   */
  @Post('checkout')
  async checkout(@Body() dto: any, @Req() req: Request) {
    // If authenticated via storefront token, use that customer
    const reqUser = (req as any).user;
    let customerId: string | null = reqUser?.customerId || null;

    // If no authenticated customer, look up or create by email/taxId (guest checkout)
    if (!customerId && dto.customerInfo) {
      const conditions: any[] = [];
      if (dto.customerInfo.email) conditions.push({ email: dto.customerInfo.email });
      if (dto.customerInfo.documentNumber) conditions.push({ taxId: dto.customerInfo.documentNumber });

      let customer = conditions.length > 0
        ? await this.prisma.customer.findFirst({ where: { OR: conditions } })
        : null;

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            fullName: `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim() || 'Cliente Web',
            email: dto.customerInfo.email || null,
            phone: dto.customerInfo.phone || null,
            taxId: dto.customerInfo.documentNumber || null,
            type: 'INDIVIDUAL',
          },
        });
      }

      customerId = customer.id;
    }

    const branch = await this.prisma.branch.findFirst({ where: { isMain: true } });
    if (!branch) throw new Error('No se encontró la sucursal principal.');
    const warehouse = await this.prisma.warehouse.findFirst({ where: { branchId: branch.id } });

    const shippingMethod: 'SHIPPING' | 'PICKUP' = dto.shippingInfo?.method === 'SHIPPING' ? 'SHIPPING' : 'PICKUP';
    const shippingCost = SHIPPING_RATES[shippingMethod];
    const orderId = dto.id || crypto.randomUUID();

    // Record the order in the ERP (status: PENDING_PAYMENT)
    const saleOrderDto = {
      id: orderId,
      branchId: branch.id,
      warehouseId: warehouse?.id || null,
      source: 'ECOMMERCE' as any,
      customerId,
      paymentMethod: 'CREDIT_CARD' as any, // MercadoPago maps to CREDIT_CARD
      paymentAccountId: null,
      status: 'PENDING_PAYMENT',
      lines: dto.cartLines.map((l: any) => ({
        variantId: l.variantId,
        quantity: l.quantity,
        unitPriceOverride: l.price,
      })),
    };

    const order = await this.checkoutOrchestrator.processCheckout(saleOrderDto);

    // Build MercadoPago preference
    const storeBase = process.env.MP_STORE_URL || 'http://localhost:5173/store';

    const { initPoint, preferenceId } = await this.mercadoPagoService.createPreference({
      externalReference: orderId,
      items: dto.cartLines.map((l: any) => ({
        id: l.variantId,
        title: l.name || `Producto (${l.variantId.slice(0, 8)})`,
        quantity: l.quantity,
        unit_price: l.price,
      })),
      payer: dto.customerInfo ? {
        name: `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim(),
        email: dto.customerInfo.email,
      } : undefined,
      shippingCost,
      backUrls: {
        success: `${storeBase}/checkout/success?orderId=${orderId}`,
        failure: `${storeBase}/checkout/failure?orderId=${orderId}`,
        pending: `${storeBase}/checkout/pending?orderId=${orderId}`,
      },
    });

    return {
      ...order,
      payment: {
        method: 'MERCADOPAGO',
        initPoint,
        preferenceId,
        shippingCost,
        shippingMethod,
      },
    };
  }

  /**
   * GET /storefront/my-orders
   * Protected — filters by authenticated customer.
   */
  @Get('my-orders')
  @UseGuards(StorefrontAuthGuard)
  async getMyOrders(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Req() req: Request,
  ) {
    const reqUser = (req as any).user;
    const customerId = reqUser.customerId;

    const pageNum = parseInt(page) || 1;
    const sizeNum = parseInt(pageSize) || 15;
    const skip = (pageNum - 1) * sizeNum;

    const [data, total] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: { source: 'ECOMMERCE', customerId },
        skip,
        take: sizeNum,
        orderBy: { createdAt: 'desc' },
        include: { lines: true, customer: true },
      }),
      this.prisma.saleOrder.count({
        where: { source: 'ECOMMERCE', customerId },
      }),
    ]);

    return {
      data: data.map(order => ({
        ...order,
        customerName: order.customer?.fullName || 'Consumidor Final',
      })),
      total,
      page: pageNum,
      pageSize: sizeNum,
    };
  }

  /**
   * GET /storefront/my-orders/:id
   * Protected — validates ownership.
   */
  @Get('my-orders/:id')
  @UseGuards(StorefrontAuthGuard)
  async getMyOrder(@Param('id') id: string, @Req() req: Request) {
    const reqUser = (req as any).user;
    const customerId = reqUser.customerId;

    const order = await this.salesService.getOrderById(id);
    if (!order) throw new ForbiddenException('Pedido no encontrado.');
    if (order.customerId !== customerId) {
      throw new ForbiddenException('No tenés permiso para ver este pedido.');
    }

    return order;
  }

  /**
   * POST /storefront/webhooks/mercadopago
   * Receives payment status notifications from MercadoPago.
   * Updates the order status from PENDING_PAYMENT to COMPLETED or CANCELLED.
   */
  @Post('webhooks/mercadopago')
  @HttpCode(HttpStatus.OK)
  async mercadoPagoWebhook(@Body() body: any) {
    this.logger.log(`[MercadoPago Webhook] Received: ${JSON.stringify(body)}`);

    const type = body?.type || body?.action;
    const resourceId = body?.data?.id || body?.resource;

    if (!type || !resourceId) {
      return { received: true };
    }

    // Only process payment events
    if (type === 'payment' || type === 'payment.updated') {
      try {
        // Fetch payment details from MercadoPago
        const mpToken = process.env.MP_ACCESS_TOKEN;
        if (!mpToken) {
          this.logger.warn('[MercadoPago Webhook] No access token configured, skipping payment verification');
          return { received: true };
        }

        const response = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
          headers: { 'Authorization': `Bearer ${mpToken}` },
        });

        if (!response.ok) {
          this.logger.error(`[MercadoPago Webhook] Failed to fetch payment ${resourceId}`);
          return { received: true };
        }

        const payment = await response.json();
        const orderId = payment.external_reference;
        const status = payment.status; // approved, pending, rejected, etc.

        if (!orderId) {
          this.logger.warn('[MercadoPago Webhook] No external_reference in payment');
          return { received: true };
        }

        this.logger.log(`[MercadoPago Webhook] Payment ${resourceId} → Order ${orderId} → Status: ${status}`);

        // Map MercadoPago status to ERP order status
        if (status === 'approved') {
          await this.prisma.saleOrder.updateMany({
            where: { id: orderId },
            data: { status: 'COMPLETED' },
          });
          this.logger.log(`[MercadoPago Webhook] ✓ Order ${orderId} marked as COMPLETED`);
        } else if (status === 'rejected' || status === 'cancelled') {
          await this.prisma.saleOrder.updateMany({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
          });
          this.logger.log(`[MercadoPago Webhook] ✗ Order ${orderId} marked as CANCELLED`);
        }
      } catch (err: any) {
        this.logger.error(`[MercadoPago Webhook] Error processing payment: ${err.message}`);
      }
    }

    return { received: true };
  }
}
