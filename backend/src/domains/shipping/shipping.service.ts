import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OrdersFulfillmentService } from '../sales/orders/orders-fulfillment.service';
import { OrderStatus } from '../sales/orders/models/fulfillment.model';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel, TemplateKey } from '../notifications/models/notification.model';
import { DeliveryValidationService } from './delivery-validation.service';
import { DispatchDeliveryDto } from './dto/dispatch-delivery.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { DeliveryStatus, ValidationMethod } from './models/delivery.model';
import * as crypto from 'crypto';

const OTP_EXPIRY_MS = 30 * 60 * 1000;

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: OrdersFulfillmentService,
    private readonly validationService: DeliveryValidationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async persistCheckoutShipping(
    saleOrderId: string,
    data: {
      shippingCost: number;
      shippingMethodId?: string;
      shippingMethodName?: string;
      shippingType?: string;
      customerName: string;
      customerPhone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    },
  ) {
    const order = await this.prisma.saleOrder.findUnique({ where: { id: saleOrderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.saleOrder.update({
        where: { id: saleOrderId },
        data: {
          shippingCost: data.shippingCost,
          shippingMethodId: data.shippingMethodId,
          shippingMethodName: data.shippingMethodName,
          grandTotal: order.grandTotal + data.shippingCost,
        },
      });

      if (data.shippingType === 'SHIPPING' && data.address) {
        await tx.shippingAddress.upsert({
          where: { saleOrderId },
          create: {
            saleOrderId,
            fullName: data.customerName,
            phone: data.customerPhone,
            address: data.address,
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
          },
          update: {
            fullName: data.customerName,
            phone: data.customerPhone,
            address: data.address,
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
          },
        });
      }

      const existing = await tx.orderFulfillment.findUnique({ where: { saleOrderId } });
      if (!existing) {
        await tx.orderFulfillment.create({
          data: {
            id: crypto.randomUUID(),
            saleOrderId,
            status: OrderStatus.PENDING_PAYMENT,
          },
        });
      }
    });
  }

  async markFulfillmentPaid(saleOrderId: string) {
    const fulfillment = await this.getFulfillmentByOrderId(saleOrderId);
    if (!fulfillment) return null;
    if (fulfillment.status !== OrderStatus.PENDING_PAYMENT) return fulfillment;

    const updated = await this.fulfillmentService.markAsPaid(fulfillment.id);
    await this.syncSaleOrderStatus(saleOrderId, 'CONFIRMED');
    return updated;
  }

  async listDeliveries(params: { status?: string; page?: number; pageSize?: number }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      saleOrder: { source: 'ECOMMERCE' },
    };
    if (params.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.orderFulfillment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          saleOrder: {
            include: {
              customer: true,
              shippingAddress: true,
              lines: true,
            },
          },
          delivery: true,
        },
      }),
      this.prisma.orderFulfillment.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async getShippingByOrderId(saleOrderId: string) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: {
        customer: true,
        shippingAddress: true,
        lines: true,
        fulfillment: { include: { delivery: { include: { validations: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async getTrackingForCustomer(saleOrderId: string, customerId: string) {
    const order = await this.getShippingByOrderId(saleOrderId);
    if (order.customerId !== customerId) {
      throw new BadRequestException('No tenés permiso para ver este pedido.');
    }
    return this.mapTrackingResponse(order);
  }

  async startPicking(saleOrderId: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const updated = await this.fulfillmentService.startPicking(fulfillment.id);
    await this.syncSaleOrderStatus(saleOrderId, 'CONFIRMED');
    return updated;
  }

  async markPacked(saleOrderId: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const updated = await this.fulfillmentService.markAsPacked(fulfillment.id);
    await this.syncSaleOrderStatus(saleOrderId, 'CONFIRMED');
    return updated;
  }

  async dispatch(saleOrderId: string, dto: DispatchDeliveryDto) {
    let fulfillment = await this.requireFulfillment(saleOrderId);

    if (fulfillment.status === OrderStatus.PENDING_PAYMENT) {
      await this.fulfillmentService.markAsPaid(fulfillment.id);
      await this.syncSaleOrderStatus(saleOrderId, 'CONFIRMED');
      fulfillment = await this.requireFulfillment(saleOrderId);
    }

    // Auto-advance through warehouse steps for MVP workflow
    if (fulfillment.status === OrderStatus.PAID) {
      await this.fulfillmentService.startPicking(fulfillment.id);
      fulfillment = await this.requireFulfillment(saleOrderId);
    }
    if (fulfillment.status === OrderStatus.PICKING) {
      await this.fulfillmentService.markAsPacked(fulfillment.id);
      fulfillment = await this.requireFulfillment(saleOrderId);
    }
    if (fulfillment.status !== OrderStatus.PACKED) {
      throw new BadRequestException('El pedido debe estar pagado y listo para despachar.');
    }

    const otp = this.validationService.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const result = await this.prisma.$transaction(async (tx) => {
      const shipped = await tx.orderFulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: OrderStatus.SHIPPED,
          trackingNumber: dto.trackingNumber || null,
          courierName: dto.courierName || 'Propio',
          shippedAt: new Date(),
        },
      });

      const delivery = await tx.delivery.upsert({
        where: { fulfillmentId: fulfillment.id },
        create: {
          fulfillmentId: fulfillment.id,
          status: DeliveryStatus.IN_TRANSIT,
          driverName: dto.driverName,
          driverPhone: dto.driverPhone,
          dispatchedAt: new Date(),
          deliveryCode: otp,
          deliveryCodeExpiresAt: expiresAt,
          notes: dto.notes,
        },
        update: {
          status: DeliveryStatus.IN_TRANSIT,
          driverName: dto.driverName,
          driverPhone: dto.driverPhone,
          dispatchedAt: new Date(),
          deliveryCode: otp,
          deliveryCodeExpiresAt: expiresAt,
          notes: dto.notes,
        },
      });

      await tx.saleOrder.update({
        where: { id: saleOrderId },
        data: { status: 'SHIPPED' },
      });

      return { fulfillment: shipped, delivery };
    });

    await this.validationService.resetAttempts(result.delivery.id);

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: { customer: true },
    });

    if (order?.customer?.phone) {
      await this.notificationsService.enqueue({
        channel: NotificationChannel.WHATSAPP,
        templateKey: TemplateKey.ORDER_SHIPPED,
        recipient: order.customer.phone,
        variables: {
          customerName: order.customer.fullName,
          orderId: saleOrderId.split('-')[0],
          courierName: dto.courierName || 'Propio',
          trackingNumber: dto.trackingNumber || 'N/A',
        },
        referenceId: saleOrderId,
      });

      await this.notificationsService.enqueue({
        channel: NotificationChannel.WHATSAPP,
        templateKey: TemplateKey.OTP_CODE,
        recipient: order.customer.phone,
        variables: { otpCode: otp },
        referenceId: `${saleOrderId}:delivery-otp`,
      });
    }

    this.logger.log(`Order ${saleOrderId} dispatched. OTP generated for delivery ${result.delivery.id}`);
    return result;
  }

  async updateLocation(saleOrderId: string, dto: UpdateLocationDto) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const delivery = await this.requireDelivery(fulfillment.id);

    if (![DeliveryStatus.IN_TRANSIT, DeliveryStatus.ARRIVED, DeliveryStatus.ASSIGNED].includes(delivery.status as DeliveryStatus)) {
      throw new BadRequestException('Solo se puede actualizar ubicación en envíos activos.');
    }

    return this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        lastLatitude: dto.latitude,
        lastLongitude: dto.longitude,
        lastLocationAt: new Date(),
        status: delivery.status === DeliveryStatus.ASSIGNED ? DeliveryStatus.IN_TRANSIT : delivery.status,
      },
    });
  }

  async markArrived(saleOrderId: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const delivery = await this.requireDelivery(fulfillment.id);

    return this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: DeliveryStatus.ARRIVED },
    });
  }

  async completeDelivery(saleOrderId: string, dto: CompleteDeliveryDto, validatedBy: 'ADMIN' | 'CUSTOMER') {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    if (fulfillment.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('El pedido debe estar en tránsito (SHIPPED) para completar la entrega.');
    }

    const delivery = await this.requireDelivery(fulfillment.id);
    const otpResult = await this.validationService.validateOtp(
      delivery.id,
      delivery.deliveryCode || '',
      dto.otp,
      delivery.deliveryCodeExpiresAt,
    );

    const validationRecord = await this.validationService.recordValidation(
      delivery.id,
      validatedBy === 'CUSTOMER' ? ValidationMethod.CUSTOMER_CONFIRM : ValidationMethod.OTP,
      otpResult.passed,
      otpResult.metadata,
    );

    await this.prisma.deliveryValidation.create({
      data: {
        deliveryId: delivery.id,
        method: validationRecord.method,
        status: validationRecord.status,
        metadata: validationRecord.metadata as any,
        validatedAt: validationRecord.validatedAt,
      },
    });

    if (!otpResult.passed) {
      throw new BadRequestException('Código de entrega incorrecto.');
    }

    await this.validationService.resetAttempts(delivery.id);

    const delivered = await this.prisma.$transaction(async (tx) => {
      await tx.orderFulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });

      const updatedDelivery = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.DELIVERED,
          notes: dto.notes || delivery.notes,
        },
      });

      await tx.saleOrder.update({
        where: { id: saleOrderId },
        data: { status: 'DELIVERED' },
      });

      return updatedDelivery;
    });

    return { delivery: delivered, fulfillment: await this.getFulfillmentByOrderId(saleOrderId) };
  }

  async completeDeliveryManual(saleOrderId: string, notes?: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    if (fulfillment.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('El pedido debe estar en tránsito (SHIPPED) para completar la entrega.');
    }

    const delivery = await this.requireDelivery(fulfillment.id);

    await this.prisma.deliveryValidation.create({
      data: {
        deliveryId: delivery.id,
        method: ValidationMethod.MANUAL,
        status: 'PASSED',
        metadata: { validatedBy: 'ADMIN', notes },
        validatedAt: new Date(),
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.orderFulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
      await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.DELIVERED, notes: notes || delivery.notes },
      });
      await tx.saleOrder.update({
        where: { id: saleOrderId },
        data: { status: 'DELIVERED' },
      });
    });

    return this.getShippingByOrderId(saleOrderId);
  }

  private mapTrackingResponse(order: any) {
    const fulfillment = order.fulfillment;
    const delivery = fulfillment?.delivery;

    return {
      orderId: order.id,
      status: fulfillment?.status || order.status,
      saleOrderStatus: order.status,
      shippingMethodName: order.shippingMethodName,
      shippingCost: order.shippingCost,
      shippingAddress: order.shippingAddress,
      trackingNumber: fulfillment?.trackingNumber,
      courierName: fulfillment?.courierName,
      timeline: {
        paidAt: fulfillment?.paidAt,
        pickedAt: fulfillment?.pickedAt,
        packedAt: fulfillment?.packedAt,
        shippedAt: fulfillment?.shippedAt,
        deliveredAt: fulfillment?.deliveredAt,
        dispatchedAt: delivery?.dispatchedAt,
      },
      delivery: delivery
        ? {
            status: delivery.status,
            driverName: delivery.driverName,
            lastLatitude: delivery.lastLatitude,
            lastLongitude: delivery.lastLongitude,
            lastLocationAt: delivery.lastLocationAt,
            hasDeliveryCode: !!delivery.deliveryCode,
          }
        : null,
      lines: order.lines,
      grandTotal: order.grandTotal,
      customerName: order.customer?.fullName,
    };
  }

  private async syncSaleOrderStatus(saleOrderId: string, status: string) {
    await this.prisma.saleOrder.update({
      where: { id: saleOrderId },
      data: { status },
    });
  }

  private async getFulfillmentByOrderId(saleOrderId: string) {
    return this.prisma.orderFulfillment.findUnique({ where: { saleOrderId } });
  }

  private async requireFulfillment(saleOrderId: string) {
    const fulfillment = await this.getFulfillmentByOrderId(saleOrderId);
    if (!fulfillment) {
      throw new NotFoundException('No existe registro de fulfillment para este pedido.');
    }
    return fulfillment;
  }

  private async requireDelivery(fulfillmentId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { fulfillmentId } });
    if (!delivery) {
      throw new NotFoundException('No existe delivery asignado para este pedido.');
    }
    return delivery;
  }
}
