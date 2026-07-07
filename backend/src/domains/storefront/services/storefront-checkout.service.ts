import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SettingsService } from '../../../modules/settings/settings.service';
import { PricingService } from '../../catalog/pricing.service';
import { v4 as uuidv4 } from 'uuid';

export interface CheckoutDto {
  id?: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    documentType: string;
    documentNumber: string;
  };
  shippingInfo: {
    method: 'SHIPPING' | 'PICKUP';
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  paymentMethod: string;
  cartLines: {
    variantId: string;
    quantity: number;
    price: number;
  }[];
  issueInvoice?: boolean;
}

@Injectable()
export class StorefrontCheckoutService {
  private readonly logger = new Logger(StorefrontCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly pricingService: PricingService,
  ) {}

  async processCheckout(authCustomerId: string | null, dto: CheckoutDto) {
    if (!dto.cartLines || dto.cartLines.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    let customerId = authCustomerId;
    let customer = customerId ? await this.prisma.customer.findUnique({ where: { id: customerId } }) : null;

    if (!customer && dto.customerInfo.email) {
      customer = await this.prisma.customer.findFirst({
        where: { email: dto.customerInfo.email }
      });
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            fullName: `${dto.customerInfo.firstName} ${dto.customerInfo.lastName}`.trim(),
            email: dto.customerInfo.email,
            phone: dto.customerInfo.phone,
            taxId: dto.customerInfo.documentNumber,
            type: 'INDIVIDUAL',
          }
        });
      }
      customerId = customer.id;
    }

    if (!customerId) {
      throw new BadRequestException('No se pudo determinar el cliente');
    }

    const storefrontConfig = await this.settingsService.getStorefrontSettings();
    const defaultBranchId = 'default-branch-id';

    let subtotal = 0;
    const orderLinesData = [];

    for (const item of dto.cartLines) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true }
      });

      if (!variant) {
        throw new BadRequestException(`La variante ${item.variantId} no existe`);
      }

      if (!variant.product.isPublished) {
        throw new BadRequestException(`El producto ${variant.product.name} ya no está disponible`);
      }

      let finalPrice: number;
      if (customer?.priceListId) {
        finalPrice = await this.pricingService.resolvePrice(item.variantId, variant.basePrice, customerId);
      } else if (storefrontConfig.priceListToShow) {
        finalPrice = await this.pricingService.resolvePriceListPrice(
          item.variantId,
          variant.basePrice,
          storefrontConfig.priceListToShow,
        );
      } else {
        finalPrice = await this.pricingService.resolvePrice(item.variantId, variant.basePrice, customerId);
      }

      subtotal += finalPrice * item.quantity;

      orderLinesData.push({
        variantId: variant.id,
        categoryId: variant.product.categoryId || 'uncategorized',
        quantity: item.quantity,
        basePrice: finalPrice,
        discountAmount: 0,
        finalPrice: finalPrice,
        historicalSku: variant.sku,
        historicalName: `${variant.product.name}`.trim(),
        historicalCost: variant.costPrice,
      });
    }

    const orderId = dto.id || uuidv4();
    const order = await this.prisma.saleOrder.create({
      data: {
        id: orderId,
        branchId: defaultBranchId,
        source: 'STOREFRONT',
        customerId: customerId,
        subtotal: subtotal,
        cartDiscountTotal: 0,
        grandTotal: subtotal,
        paymentMethod: dto.paymentMethod || 'EFECTIVO',
        status: 'QUOTE',
        issueInvoice: dto.issueInvoice || false,
        createdAt: new Date(),
        lines: {
          create: orderLinesData
        }
      },
      include: {
        lines: true
      }
    });

    this.logger.log(`Checkout successful for customer ${customerId}, Order: ${orderId}`);
    return { success: true, orderId: order.id, total: subtotal, payment: null };
  }
}
