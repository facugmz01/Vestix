import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
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

  constructor(private readonly prisma: PrismaService) {}

  async processCheckout(authCustomerId: string | null, dto: CheckoutDto) {
    if (!dto.cartLines || dto.cartLines.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Find or create customer
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

    // Get system settings for storefront configuration
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const storefrontConfig = (settings as any)?.storefront || {};
    
    // Fallbacks
    const defaultBranchId = 'default-branch-id'; // Ideally this should come from settings
    const priceListId = customer?.priceListId || storefrontConfig.priceListToShow || 'retail-default';

    let subtotal = 0;
    const orderLinesData = [];

    for (const item of dto.cartLines) {
      // Find variant and its base price
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

      // Find price from PriceListEntry
      const priceEntry = await this.prisma.priceListEntry.findUnique({
        where: { priceListId_variantId: { priceListId, variantId: item.variantId } }
      });

      const finalPrice = priceEntry ? priceEntry.overridePrice : variant.basePrice;
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

    // Create SaleOrder
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
        status: 'QUOTE', // PENDING/QUOTE for storefront orders until paid/confirmed
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
