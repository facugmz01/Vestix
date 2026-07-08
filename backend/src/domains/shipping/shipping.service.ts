import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Subject, Observable, from } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OrdersFulfillmentService } from '../sales/orders/orders-fulfillment.service';
import { OrderStatus } from '../sales/orders/models/fulfillment.model';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel, TemplateKey } from '../notifications/models/notification.model';
import { SettingsService, DeliverySettings } from '../../modules/settings/settings.service';
import { DeliveryValidationService } from './delivery-validation.service';
import { GeocodingService } from './geocoding.service';
import { DispatchDeliveryDto } from './dto/dispatch-delivery.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { DeliveryStatus, ValidationMethod } from './models/delivery.model';
import * as crypto from 'crypto';

const OTP_EXPIRY_MS = 30 * 60 * 1000;

export interface TrackingEventPayload {
  orderId: string;
  status: string;
  deliveryStatus?: string;
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastLocationAt?: string | null;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly trackingEvents = new Subject<TrackingEventPayload>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: OrdersFulfillmentService,
    private readonly validationService: DeliveryValidationService,
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService,
    private readonly geocodingService: GeocodingService,
  ) {}

  subscribeTracking(orderId: string): Observable<{ data: TrackingEventPayload }> {
    return this.trackingEvents.pipe(
      filter(evt => evt.orderId === orderId),
      map(evt => ({ data: evt })),
    );
  }

  subscribeTrackingByToken(trackingToken: string): Observable<{ data: TrackingEventPayload }> {
    return from(
      this.prisma.delivery.findUnique({
        where: { trackingToken },
        include: { fulfillment: true },
      }),
    ).pipe(
      switchMap(delivery => {
        if (!delivery) {
          throw new NotFoundException('Código de seguimiento no válido');
        }
        const orderId = delivery.fulfillment.saleOrderId;
        return this.trackingEvents.pipe(
          filter(evt => evt.orderId === orderId),
          map(evt => ({ data: this.sanitizePublicEvent(evt) })),
        );
      }),
    );
  }

  async getDeliverySettings(): Promise<DeliverySettings> {
    const storefront = await this.settingsService.getStorefrontSettings();
    const defaults: DeliverySettings = {
      enableGpsTracking: true,
      enableGeofence: true,
      geofenceRadiusMeters: 150,
      requirePhotoOnDelivery: false,
      showMapToCustomer: true,
    };
    return { ...defaults, ...storefront.deliverySettings };
  }

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

    let coords: { latitude: number; longitude: number } | null = null;
    if (data.shippingType === 'SHIPPING' && data.address) {
      coords = await this.geocodingService.geocodeAddress(
        data.address,
        data.city || '',
        data.state || '',
        data.zipCode || '',
      );
    }

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
            latitude: coords?.latitude,
            longitude: coords?.longitude,
          },
          update: {
            fullName: data.customerName,
            phone: data.customerPhone,
            address: data.address,
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            latitude: coords?.latitude,
            longitude: coords?.longitude,
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
    await this.syncAllStatuses(saleOrderId, OrderStatus.PAID);
    return updated;
  }

  async listDeliveries(params: { status?: string; page?: number; pageSize?: number }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { saleOrder: { source: 'ECOMMERCE' } };
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.orderFulfillment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          saleOrder: {
            include: { customer: true, shippingAddress: true, lines: true },
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

  async getPublicTracking(trackingToken: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { trackingToken },
      include: {
        fulfillment: {
          include: {
            saleOrder: { include: { shippingAddress: true, lines: true } },
          },
        },
      },
    });
    if (!delivery) throw new NotFoundException('Código de seguimiento no válido');

    const order = delivery.fulfillment.saleOrder;
    const fulfillment = delivery.fulfillment;

    return {
      orderRef: order.id.split('-')[0],
      status: fulfillment.status,
      trackingNumber: fulfillment.trackingNumber,
      courierName: fulfillment.courierName,
      city: order.shippingAddress?.city,
      state: order.shippingAddress?.state,
      timeline: {
        paidAt: fulfillment.paidAt,
        packedAt: fulfillment.packedAt,
        shippedAt: fulfillment.shippedAt,
        dispatchedAt: delivery.dispatchedAt,
        deliveredAt: fulfillment.deliveredAt,
      },
      delivery: {
        status: delivery.status,
        lastLatitude: delivery.lastLatitude,
        lastLongitude: delivery.lastLongitude,
        lastLocationAt: delivery.lastLocationAt,
      },
      itemCount: order.lines.reduce((acc, l) => acc + l.quantity, 0),
    };
  }

  async getDriverDelivery(driverToken: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { driverToken },
      include: {
        fulfillment: {
          include: {
            saleOrder: {
              include: { customer: true, shippingAddress: true, lines: true },
            },
          },
        },
      },
    });
    if (!delivery) throw new NotFoundException('Link de repartidor no válido o expirado');

    const order = delivery.fulfillment.saleOrder;
    const settings = await this.getDeliverySettings();

    return {
      deliveryId: delivery.id,
      orderId: order.id,
      orderRef: order.id.split('-')[0],
      status: delivery.status,
      fulfillmentStatus: delivery.fulfillment.status,
      driverName: delivery.driverName,
      customerName: order.shippingAddress?.fullName || order.customer?.fullName,
      customerPhone: order.shippingAddress?.phone || order.customer?.phone,
      shippingAddress: order.shippingAddress,
      lines: order.lines.map(l => ({
        quantity: l.quantity,
        productName: l.historicalName,
      })),
      settings: {
        requirePhotoOnDelivery: settings.requirePhotoOnDelivery,
        enableGeofence: settings.enableGeofence,
      },
    };
  }

  async startPicking(saleOrderId: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const updated = await this.fulfillmentService.startPicking(fulfillment.id);
    await this.syncAllStatuses(saleOrderId, OrderStatus.PICKING);
    this.emitTracking(saleOrderId, OrderStatus.PICKING);
    return updated;
  }

  async markPacked(saleOrderId: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const updated = await this.fulfillmentService.markAsPacked(fulfillment.id);
    await this.syncAllStatuses(saleOrderId, OrderStatus.PACKED);
    this.emitTracking(saleOrderId, OrderStatus.PACKED);
    return updated;
  }

  async dispatch(saleOrderId: string, dto: DispatchDeliveryDto) {
    let fulfillment = await this.requireFulfillment(saleOrderId);

    if (fulfillment.status === OrderStatus.PENDING_PAYMENT) {
      await this.fulfillmentService.markAsPaid(fulfillment.id);
      fulfillment = await this.requireFulfillment(saleOrderId);
    }
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
    const trackingToken = crypto.randomBytes(16).toString('hex');
    const driverToken = crypto.randomBytes(24).toString('hex');

    await this.fulfillmentService.shipOrder(
      fulfillment.id,
      dto.trackingNumber || '',
      dto.courierName || 'Propio',
    );

    const delivery = await this.prisma.delivery.upsert({
      where: { fulfillmentId: fulfillment.id },
      create: {
        fulfillmentId: fulfillment.id,
        status: DeliveryStatus.IN_TRANSIT,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        dispatchedAt: new Date(),
        deliveryCode: otp,
        deliveryCodeExpiresAt: expiresAt,
        trackingToken,
        driverToken,
        notes: dto.notes,
      },
      update: {
        status: DeliveryStatus.IN_TRANSIT,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        dispatchedAt: new Date(),
        deliveryCode: otp,
        deliveryCodeExpiresAt: expiresAt,
        trackingToken,
        driverToken,
        notes: dto.notes,
      },
    });

    await this.syncAllStatuses(saleOrderId, OrderStatus.SHIPPED, DeliveryStatus.IN_TRANSIT);
    await this.validationService.resetAttempts(delivery.id);

    const baseUrl = this.getPublicBaseUrl();
    const links = {
      trackingUrl: `${baseUrl}/track/${trackingToken}`,
      driverUrl: `${baseUrl}/driver/${driverToken}`,
    };

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
          trackingNumber: dto.trackingNumber || links.trackingUrl,
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

    this.emitTracking(saleOrderId, OrderStatus.SHIPPED, DeliveryStatus.IN_TRANSIT);
    this.logger.log(`Order ${saleOrderId} dispatched. Tracking: ${links.trackingUrl}`);

    return {
      fulfillment: await this.getFulfillmentByOrderId(saleOrderId),
      delivery,
      links,
      otpForAdmin: otp,
    };
  }

  async updateLocation(saleOrderId: string, dto: UpdateLocationDto) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const delivery = await this.requireDelivery(fulfillment.id);

    if (![DeliveryStatus.IN_TRANSIT, DeliveryStatus.ARRIVED, DeliveryStatus.ASSIGNED].includes(delivery.status as DeliveryStatus)) {
      throw new BadRequestException('Solo se puede actualizar ubicación en envíos activos.');
    }

    const updated = await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        lastLatitude: dto.latitude,
        lastLongitude: dto.longitude,
        lastLocationAt: new Date(),
        status: delivery.status === DeliveryStatus.ASSIGNED ? DeliveryStatus.IN_TRANSIT : delivery.status,
      },
    });

    this.emitTracking(saleOrderId, fulfillment.status, updated.status as DeliveryStatus, updated);
    return updated;
  }

  async updateLocationByDriverToken(driverToken: string, dto: UpdateLocationDto) {
    const delivery = await this.requireDeliveryByDriverToken(driverToken);
    return this.updateLocation(delivery.fulfillment.saleOrderId, dto);
  }

  async markArrived(saleOrderId: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const delivery = await this.requireDelivery(fulfillment.id);

    const updated = await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: DeliveryStatus.ARRIVED },
    });

    this.emitTracking(saleOrderId, fulfillment.status, DeliveryStatus.ARRIVED, updated);
    return updated;
  }

  async markArrivedByDriverToken(driverToken: string) {
    const delivery = await this.requireDeliveryByDriverToken(driverToken);
    return this.markArrived(delivery.fulfillment.saleOrderId);
  }

  async uploadProofPhoto(saleOrderId: string, photoUrl: string) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    const delivery = await this.requireDelivery(fulfillment.id);

    return this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { proofPhotoUrl: photoUrl },
    });
  }

  async uploadProofPhotoByDriverToken(driverToken: string, photoUrl: string) {
    const delivery = await this.requireDeliveryByDriverToken(driverToken);
    return this.uploadProofPhoto(delivery.fulfillment.saleOrderId, photoUrl);
  }

  async completeDelivery(
    saleOrderId: string,
    dto: CompleteDeliveryDto,
    validatedBy: 'ADMIN' | 'CUSTOMER' | 'DRIVER',
    driverCoords?: { latitude: number; longitude: number },
  ) {
    const fulfillment = await this.requireFulfillment(saleOrderId);
    if (fulfillment.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('El pedido debe estar en tránsito (SHIPPED) para completar la entrega.');
    }

    const delivery = await this.requireDelivery(fulfillment.id);
    const settings = await this.getDeliverySettings();
    const order = await this.getShippingByOrderId(saleOrderId);

    if (settings.requirePhotoOnDelivery && !delivery.proofPhotoUrl) {
      throw new BadRequestException('Se requiere foto de entrega antes de completar.');
    }

    const otpResult = await this.validationService.validateOtp(
      delivery.id,
      delivery.deliveryCode || '',
      dto.otp,
      delivery.deliveryCodeExpiresAt,
    );

    const methodMap = {
      ADMIN: ValidationMethod.OTP,
      CUSTOMER: ValidationMethod.CUSTOMER_CONFIRM,
      DRIVER: ValidationMethod.OTP,
    };

    await this.prisma.deliveryValidation.create({
      data: {
        deliveryId: delivery.id,
        method: methodMap[validatedBy],
        status: otpResult.passed ? 'PASSED' : 'FAILED',
        metadata: otpResult.metadata as any,
        validatedAt: otpResult.passed ? new Date() : null,
      },
    });

    if (!otpResult.passed) {
      throw new BadRequestException('Código de entrega incorrecto.');
    }

    if (settings.enableGeofence && order.shippingAddress?.latitude && order.shippingAddress?.longitude) {
      const lat = driverCoords?.latitude ?? delivery.lastLatitude;
      const lng = driverCoords?.longitude ?? delivery.lastLongitude;
      if (lat == null || lng == null) {
        throw new BadRequestException('No hay ubicación GPS para validar geofence.');
      }
      const geo = this.validationService.validateGeofence(
        lat,
        lng,
        order.shippingAddress.latitude,
        order.shippingAddress.longitude,
        settings.geofenceRadiusMeters,
      );
      await this.prisma.deliveryValidation.create({
        data: {
          deliveryId: delivery.id,
          method: ValidationMethod.GEOFENCE,
          status: geo.passed ? 'PASSED' : 'FAILED',
          metadata: geo.metadata as any,
          validatedAt: geo.passed ? new Date() : null,
        },
      });
      if (!geo.passed) {
        throw new BadRequestException(
          `El repartidor está a ${geo.metadata.distanceMeters}m del destino (máx. ${settings.geofenceRadiusMeters}m).`,
        );
      }
    }

    if (delivery.proofPhotoUrl) {
      await this.prisma.deliveryValidation.create({
        data: {
          deliveryId: delivery.id,
          method: ValidationMethod.PHOTO,
          status: 'PASSED',
          metadata: { proofPhotoUrl: delivery.proofPhotoUrl },
          validatedAt: new Date(),
        },
      });
    }

    await this.validationService.resetAttempts(delivery.id);

    const delivered = await this.prisma.$transaction(async (tx) => {
      await tx.orderFulfillment.update({
        where: { id: fulfillment.id },
        data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
      });
      const updatedDelivery = await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.DELIVERED, notes: dto.notes || delivery.notes },
      });
      await tx.saleOrder.update({
        where: { id: saleOrderId },
        data: { status: 'DELIVERED' },
      });
      return updatedDelivery;
    });

    this.emitTracking(saleOrderId, OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, delivered);
    return { delivery: delivered, fulfillment: await this.getFulfillmentByOrderId(saleOrderId) };
  }

  async completeDeliveryByDriverToken(
    driverToken: string,
    dto: CompleteDeliveryDto,
    coords?: { latitude: number; longitude: number },
  ) {
    const delivery = await this.requireDeliveryByDriverToken(driverToken);
    return this.completeDelivery(
      delivery.fulfillment.saleOrderId,
      dto,
      'DRIVER',
      coords,
    );
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
        data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
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

    this.emitTracking(saleOrderId, OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);
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
      trackingToken: delivery?.trackingToken,
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
            proofPhotoUrl: delivery.proofPhotoUrl,
          }
        : null,
      lines: order.lines,
      grandTotal: order.grandTotal,
      customerName: order.customer?.fullName,
    };
  }

  private async syncAllStatuses(
    saleOrderId: string,
    fulfillmentStatus: OrderStatus,
    deliveryStatus?: DeliveryStatus,
  ) {
    const saleOrderStatusMap: Record<string, string> = {
      [OrderStatus.PENDING_PAYMENT]: 'PENDING_PAYMENT',
      [OrderStatus.PAID]: 'CONFIRMED',
      [OrderStatus.PICKING]: 'CONFIRMED',
      [OrderStatus.PACKED]: 'CONFIRMED',
      [OrderStatus.SHIPPED]: 'SHIPPED',
      [OrderStatus.DELIVERED]: 'DELIVERED',
      [OrderStatus.CANCELLED]: 'CANCELLED',
    };

    await this.prisma.saleOrder.update({
      where: { id: saleOrderId },
      data: { status: saleOrderStatusMap[fulfillmentStatus] || 'CONFIRMED' },
    });

    if (deliveryStatus) {
      const fulfillment = await this.getFulfillmentByOrderId(saleOrderId);
      if (fulfillment?.delivery) {
        await this.prisma.delivery.update({
          where: { id: fulfillment.delivery.id },
          data: { status: deliveryStatus },
        });
      }
    }
  }

  private emitTracking(
    orderId: string,
    status: string,
    deliveryStatus?: string,
    delivery?: { lastLatitude?: number | null; lastLongitude?: number | null; lastLocationAt?: Date | null; status?: string },
  ) {
    this.trackingEvents.next({
      orderId,
      status,
      deliveryStatus: deliveryStatus || delivery?.status,
      lastLatitude: delivery?.lastLatitude,
      lastLongitude: delivery?.lastLongitude,
      lastLocationAt: delivery?.lastLocationAt?.toISOString() ?? null,
    });
  }

  private sanitizePublicEvent(evt: TrackingEventPayload): TrackingEventPayload {
    return {
      orderId: evt.orderId.split('-')[0],
      status: evt.status,
      deliveryStatus: evt.deliveryStatus,
      lastLatitude: evt.lastLatitude,
      lastLongitude: evt.lastLongitude,
      lastLocationAt: evt.lastLocationAt,
    };
  }

  private getPublicBaseUrl(): string {
    const storefront = process.env.STOREFRONT_URL || process.env.MP_STORE_URL || 'http://localhost:3000/store';
    return storefront.replace(/\/store\/?$/, '');
  }

  private async getFulfillmentByOrderId(saleOrderId: string) {
    return this.prisma.orderFulfillment.findUnique({
      where: { saleOrderId },
      include: { delivery: true },
    });
  }

  private async requireFulfillment(saleOrderId: string) {
    const fulfillment = await this.getFulfillmentByOrderId(saleOrderId);
    if (!fulfillment) {
      throw new NotFoundException('No existe registro de fulfillment para este pedido.');
    }
    return fulfillment;
  }

  private async requireDelivery(fulfillmentId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { fulfillmentId },
      include: { fulfillment: true },
    });
    if (!delivery) {
      throw new NotFoundException('No existe delivery asignado para este pedido.');
    }
    return delivery;
  }

  private async requireDeliveryByDriverToken(driverToken: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { driverToken },
      include: { fulfillment: true },
    });
    if (!delivery) {
      throw new NotFoundException('Link de repartidor no válido.');
    }
    return delivery;
  }
}
