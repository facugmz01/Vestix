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
import { InventoryService } from '../logistics/inventory.service';
import { StorefrontAuthGuard } from './storefront-auth.guard';
import { StorefrontOptionalAuthGuard } from './storefront-optional-auth.guard';
import { SettingsService } from '../../modules/settings/settings.service';
import { ShippingService } from '../shipping/shipping.service';
import { NotificationTriggersService } from '../notifications/notification-triggers.service';
import { resolveStorefrontBaseUrl } from './storefront-url.util';
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
    private readonly inventoryService: InventoryService,
    private readonly settingsService: SettingsService,
    private readonly shippingService: ShippingService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}

  /**
   * GET /storefront/manifest.json
   * Returns a dynamic PWA manifest based on the system settings.
   */
  @Get('manifest.json')
  async getManifest() {
    const pwa = await this.settingsService.getPwaSettings();

    return {
      short_name: pwa.appShortName || 'VentaWeb',
      name: pwa.appName || 'VentaWeb - ERP & Tienda',
      description: 'Sistema ERP y Tienda Online',
      icons: [
        {
          src: pwa.iconUrl || '/favicon.svg',
          type: pwa.iconUrl?.endsWith('.png') ? 'image/png' : 'image/svg+xml',
          sizes: '192x192 512x512',
          purpose: 'any maskable'
        }
      ],
      start_url: '/',
      display: 'standalone',
      background_color: pwa.backgroundColor || '#ffffff',
      theme_color: pwa.themeColor || '#3b82f6',
      orientation: 'portrait-primary',
    };
  }

  /**
   * GET /storefront/settings
   * Returns the public configuration for the storefront, including payment and shipping methods.
   */
  @Get('settings')
  async getSettings() {
    const storefront = await this.settingsService.getStorefrontSettings();
    const pwa = await this.settingsService.getPwaSettings();

    // Fetch allowed payment methods details
    let paymentMethods = [];
    if (storefront.allowedPaymentMethods?.length > 0) {
      paymentMethods = await this.prisma.paymentMethod.findMany({
        where: { id: { in: storefront.allowedPaymentMethods }, isActive: true },
        select: { id: true, name: true, type: true }
      });
    }

    return {
      ...storefront,
      pwa,
      paymentMethods,
    };
  }

  /**
   * POST /storefront/checkout
   * Creates the order in the ERP (inventory deduction, etc.).
   * Returns the order + a MercadoPago init_point URL for payment.
   */
  @Post('checkout')
  @UseGuards(StorefrontOptionalAuthGuard)
  async checkout(@Body() dto: any, @Req() req: Request) {
    // If authenticated via storefront token, use that customer
    const reqUser = (req as any).user;
    let customerId: string | null = reqUser?.customerId || null;

    // If authenticated, optionally enrich profile from checkout data
    if (customerId && dto.customerInfo) {
      const existing = await this.prisma.customer.findUnique({ where: { id: customerId } });
      if (existing) {
        const patch: Record<string, string | null> = {};
        const checkoutName = `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim();
        if (checkoutName && (!existing.fullName || existing.fullName.startsWith('Cliente +'))) {
          patch.fullName = checkoutName;
        }
        if (dto.customerInfo.email && !existing.email) {
          patch.email = this.normalizeEmail(dto.customerInfo.email);
        }
        if (dto.customerInfo.phone && !existing.phone) {
          patch.phone = this.normalizePhone(dto.customerInfo.phone);
        }
        if (dto.customerInfo.documentNumber && !existing.taxId) {
          patch.taxId = dto.customerInfo.documentNumber.trim() || null;
        }
        if (Object.keys(patch).length > 0) {
          await this.prisma.customer.update({ where: { id: customerId }, data: patch });
        }
      }
    }

    // If no authenticated customer, look up or create by phone/email/taxId (guest checkout)
    if (!customerId && dto.customerInfo) {
      const conditions: any[] = [];
      if (dto.customerInfo.phone) {
        const normalizedPhone = this.normalizePhone(dto.customerInfo.phone);
        if (normalizedPhone) {
          conditions.push({ phone: normalizedPhone });
          const digits = String(dto.customerInfo.phone).replace(/\D/g, '');
          if (digits && digits !== normalizedPhone) {
            conditions.push({ phone: digits });
          }
        }
      }
      if (dto.customerInfo.email) {
        const normalizedEmail = this.normalizeEmail(dto.customerInfo.email);
        if (normalizedEmail) conditions.push({ email: normalizedEmail });
      }
      if (dto.customerInfo.documentNumber) conditions.push({ taxId: dto.customerInfo.documentNumber });

      let customer = conditions.length > 0
        ? await this.prisma.customer.findFirst({ where: { OR: conditions } })
        : null;

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            fullName: `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim() || 'Cliente Web',
            email: this.normalizeEmail(dto.customerInfo.email || '') || null,
            phone: this.normalizePhone(dto.customerInfo.phone || '') || null,
            taxId: dto.customerInfo.documentNumber || null,
            type: 'INDIVIDUAL',
            source: 'STOREFRONT',
          },
        });
      } else {
        // Enrich profile with checkout data when fields are still empty
        const patch: Record<string, string | null> = {};
        const checkoutName = `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim();
        if (checkoutName && (!customer.fullName || customer.fullName.startsWith('Cliente +'))) {
          patch.fullName = checkoutName;
        }
        const checkoutEmail = this.normalizeEmail(dto.customerInfo.email || '');
        if (checkoutEmail && !customer.email) patch.email = checkoutEmail;
        const checkoutPhone = this.normalizePhone(dto.customerInfo.phone || '');
        if (checkoutPhone && !customer.phone) patch.phone = checkoutPhone;
        if (dto.customerInfo.documentNumber && !customer.taxId) patch.taxId = dto.customerInfo.documentNumber;
        if (customer.source === 'ADMIN' || !customer.source) {
          // leave ADMIN as-is if they already existed in backoffice
        } else if (customer.source !== 'STOREFRONT') {
          patch.source = 'STOREFRONT';
        }
        if (Object.keys(patch).length > 0) {
          customer = await this.prisma.customer.update({
            where: { id: customer.id },
            data: patch,
          });
        }
      }

      customerId = customer.id;
    }

    const branch = await this.prisma.branch.findFirst({ where: { isMain: true } });
    if (!branch) throw new Error('No se encontró la sucursal principal.');
    const warehouse = await this.prisma.warehouse.findFirst({ where: { branchId: branch.id } });

    const storefront = await this.settingsService.getStorefrontSettings();

    const shippingMethods = storefront.shippingMethods || [];
    const selectedShipping = shippingMethods.find(m => m.id === dto.shippingInfo?.method);
    const shippingCost = selectedShipping ? selectedShipping.price : 0;
    const shippingMethodLabel = selectedShipping ? selectedShipping.type : 'PICKUP';

    const paymentMethodId = dto.paymentMethod; // It should be the ID of the PaymentMethod now
    const selectedPaymentMethod = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });

    if (!selectedPaymentMethod) {
      throw new Error('Método de pago no válido.');
    }

    if (MercadoPagoService.isMercadoPagoPaymentMethod(selectedPaymentMethod.type)) {
      await this.mercadoPagoService.ensureConfigured();
    }

    const orderId = dto.id || crypto.randomUUID();

    // Record the order in the ERP (status: PENDING_PAYMENT)
    const saleOrderDto = {
      id: orderId,
      branchId: branch.id,
      warehouseId: warehouse?.id || null,
      source: 'ECOMMERCE' as any,
      customerId,
      paymentMethod: selectedPaymentMethod.type as any, // CASH | CREDIT_CARD | BANK_TRANSFER
      paymentAccountId: null,
      status: 'PENDING_PAYMENT',
      lines: dto.cartLines.map((l: any) => ({
        variantId: l.variantId,
        quantity: l.quantity,
        unitPriceOverride: l.price,
      })),
    };

    const order = await this.checkoutOrchestrator.processCheckout(saleOrderDto);

    const customerName = dto.customerInfo
      ? `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim() || 'Cliente Web'
      : 'Cliente Web';

    await this.shippingService.persistCheckoutShipping(orderId, {
      shippingCost,
      shippingMethodId: dto.shippingInfo?.method,
      shippingMethodName: selectedShipping?.name,
      shippingType: selectedShipping?.type || shippingMethodLabel,
      customerName,
      customerPhone: dto.customerInfo?.phone,
      address: dto.shippingInfo?.address,
      city: dto.shippingInfo?.city,
      state: dto.shippingInfo?.state,
      zipCode: dto.shippingInfo?.zipCode,
    });

    const updatedOrder = await this.salesService.getOrderById(orderId);

    // Checkout Pro via Mercado Pago for online card/wallet payments
    if (MercadoPagoService.isMercadoPagoPaymentMethod(selectedPaymentMethod.type)) {
      const storeBase = resolveStorefrontBaseUrl(req);

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
        ...updatedOrder,
        payment: {
          method: 'MERCADOPAGO',
          initPoint,
          preferenceId,
          shippingCost,
          shippingMethod: shippingMethodLabel,
        },
      };
    }

    // For non-MP payments (CASH, BANK_TRANSFER, etc.)
    void this.notificationTriggers.onSaleCompleted(orderId);

    return {
      ...updatedOrder,
      payment: {
        method: selectedPaymentMethod.type,
        shippingCost,
        shippingMethod: shippingMethodLabel,
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
        include: {
          lines: true,
          customer: true,
          shippingAddress: true,
          fulfillment: { include: { delivery: true } },
        },
      }),
      this.prisma.saleOrder.count({
        where: { source: 'ECOMMERCE', customerId },
      }),
    ]);

    return {
      data: data.map(order => ({
        ...order,
        customerName: order.customer?.fullName || 'Consumidor Final',
        trackingStatus: order.fulfillment?.status || order.status,
        trackingNumber: order.fulfillment?.trackingNumber,
        courierName: order.fulfillment?.courierName,
        dispatchedAt: order.fulfillment?.delivery?.dispatchedAt,
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

    const fullOrder = await this.prisma.saleOrder.findUnique({
      where: { id: order.id },
      include: {
        lines: true,
        customer: true,
        shippingAddress: true,
        fulfillment: { include: { delivery: true } },
      },
    });

    return {
      ...fullOrder,
      customerName: fullOrder?.customer?.fullName || 'Consumidor Final',
      trackingStatus: fullOrder?.fulfillment?.status || fullOrder?.status,
    };
  }

  /**
   * POST /storefront/webhooks/mercadopago
   * Receives payment status notifications from MercadoPago.
   * Updates the order status from PENDING_PAYMENT to COMPLETED or CANCELLED.
   */
  @Post('webhooks/mercadopago')
  @HttpCode(HttpStatus.OK)
  async mercadoPagoWebhook(@Body() body: any, @Req() req: Request) {
    this.logger.log(`[MercadoPago Webhook] Received: ${JSON.stringify(body)}`);

    const type = body?.type || body?.action;
    const resourceId = body?.data?.id || body?.resource;

    if (!type || !resourceId) {
      return { received: true };
    }

    // Verify webhook signature if MP_WEBHOOK_SECRET is set
    const signatureResult = await this.mercadoPagoService.verifyWebhookSignature(
      req.headers as Record<string, string | string[] | undefined>,
      resourceId,
    );

    if (!signatureResult.valid) {
      this.logger.warn(`[MercadoPago Webhook] ${signatureResult.error}`);
      return { received: false, error: signatureResult.error };
    }

    // Only process payment events
    if (type === 'payment' || type === 'payment.updated') {
      try {
        // Fetch payment details from MercadoPago
        const payment = await this.mercadoPagoService.fetchPayment(resourceId);
        if (!payment) {
          this.logger.warn('[MercadoPago Webhook] No access token or payment fetch failed');
          return { received: true };
        }
        const orderId = payment.external_reference;
        const status = payment.status; // approved, pending, rejected, etc.

        if (!orderId) {
          this.logger.warn('[MercadoPago Webhook] No external_reference in payment');
          return { received: true };
        }

        this.logger.log(`[MercadoPago Webhook] Payment ${resourceId} → Order ${orderId} → Status: ${status}`);

        // Map MercadoPago status to ERP order status
        if (status === 'approved') {
          const order = await this.prisma.saleOrder.findUnique({
            where: { id: orderId },
          });

          if (order && order.status === 'PENDING_PAYMENT') {
            await this.checkoutOrchestrator.confirmPayment(orderId, String(resourceId));

            if (order.source === 'ECOMMERCE') {
              await this.shippingService.markFulfillmentPaid(orderId);
            }

            this.logger.log(`[MercadoPago Webhook] ✓ Order ${orderId} confirmed and customer notified.`);
          }
        } else if (status === 'rejected' || status === 'cancelled') {
          const order = await this.prisma.saleOrder.findUnique({
            where: { id: orderId },
          });

          if (order && order.status === 'PENDING_PAYMENT') {
            await this.checkoutOrchestrator.cancelOrder(orderId);
            this.logger.log(`[MercadoPago Webhook] ✗ Order ${orderId} marked as CANCELLED and reservations released.`);
          }
        }
      } catch (err: any) {
        this.logger.error(`[MercadoPago Webhook] Error processing payment: ${err.message}`);
      }
    }

    return { received: true };
  }

  private normalizeEmail(raw: string): string | null {
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) return null;
    return email;
  }

  private normalizePhone(raw: string): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) return null;

    if (digits.startsWith('549') && digits.length >= 12) return digits;
    if (digits.startsWith('54') && digits.length >= 11) return digits;

    if (digits.startsWith('0') && digits.length >= 10) {
      return '54' + digits.slice(1);
    }

    if (digits.length >= 8 && digits.length <= 11) {
      return '549' + digits;
    }

    return digits;
  }
}
