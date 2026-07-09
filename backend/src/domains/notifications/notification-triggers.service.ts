import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { NotificationsService } from './notifications.service';
import { StaffInboxService } from './staff-inbox.service';
import { NotificationChannel, TemplateKey } from './models/notification.model';
import {
  ContactRecipients,
  getEventChannels,
  resolveRecipient,
} from './utils/notification-channels.util';

@Injectable()
export class NotificationTriggersService {
  private readonly logger = new Logger(NotificationTriggersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly staffInbox: StaffInboxService,
  ) {}

  // ─── Manual dispatch ───────────────────────────────────────────────────────

  async sendManualSaleReceipt(
    orderId: string,
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS',
    recipient: string,
  ) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Venta no encontrada');

    const job = await this.notifications.enqueue({
      channel: channel as NotificationChannel,
      templateKey: TemplateKey.MANUAL_SALE_RECEIPT,
      recipient,
      variables: {
        customerName: order.customer?.fullName || 'Cliente',
        saleId:       this.shortId(order.id),
        total:        this.formatMoney(order.grandTotal),
        receiptUrl:   `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/sales/${order.id}`,
      },
      referenceId: order.id,
    });

    if (!job) {
      throw new BadRequestException(
        'No se pudo encolar el comprobante. Verificá que el canal esté habilitado y la plantilla activa.',
      );
    }

    return {
      success: true,
      message: 'Comprobante de venta enviado a la cola de notificaciones',
      job,
    };
  }

  async sendManualAccountStatement(
    accountId: string,
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS',
    recipient: string,
  ) {
    const account = await this.resolveAccount(accountId);

    const job = await this.notifications.enqueue({
      channel: channel as NotificationChannel,
      templateKey: TemplateKey.MANUAL_CURRENT_ACCOUNT_STATEMENT,
      recipient,
      variables: {
        customerName: account.entityName,
        balance:      this.formatMoney(account.balance),
        overdueAmount: this.formatMoney(account.overdueAmount),
      },
      referenceId: account.id,
    });

    if (!job) {
      throw new BadRequestException(
        'No se pudo encolar el resumen. Verificá que el canal esté habilitado y la plantilla activa.',
      );
    }

    return { success: true, message: 'Resumen enviado a la cola de notificaciones', job };
  }

  async sendOverdueNotices() {
    const settings = await this.settingsService.getNotificationSettings();
    const channels = getEventChannels(settings, 'saleChannels').length > 0
      ? getEventChannels(settings, 'saleChannels')
      : [settings.whatsappEnabled !== false
          ? NotificationChannel.WHATSAPP
          : NotificationChannel.EMAIL];

    const customers = await this.prisma.customer.findMany({
      where: { isActive: true, usedCredit: { gt: 0 } },
    });

    let sent = 0;
    let skipped = 0;

    for (const customer of customers) {
      const overdueAmount = this.customerOverdue(customer.usedCredit, customer.creditLimit);
      if (overdueAmount <= 0) {
        skipped++;
        continue;
      }

      let delivered = false;
      for (const channel of channels) {
        const recipient = resolveRecipient(
          channel,
          { email: customer.email, phone: customer.phone },
          (phone) => this.normalizePhone(phone),
        );
        if (!recipient) continue;

        const job = await this.notifications.enqueue({
          channel,
          templateKey: TemplateKey.OVERDUE_CURRENT_ACCOUNT,
          recipient,
          variables: {
            customerName:  customer.fullName,
            balance:       this.formatMoney(customer.usedCredit),
            overdueAmount: this.formatMoney(overdueAmount),
          },
          referenceId: customer.id,
        });

        if (job) {
          delivered = true;
          sent++;
          break;
        }
      }

      if (!delivered) skipped++;
    }

    return {
      success: true,
      message: `Avisos de vencimiento: ${sent} encolados, ${skipped} omitidos`,
      sent,
      skipped,
    };
  }

  // ─── Automatic event triggers ──────────────────────────────────────────────

  async onSaleCompleted(orderId: string) {
    const settings = await this.settingsService.getNotificationSettings();
    if (!settings.notifyOnSale) return;

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return;

    const customerName = order.customer?.fullName || 'Cliente';
    const vars = {
      customerName,
      orderId: this.shortId(order.id),
      total:   this.formatMoney(order.grandTotal),
    };

    await this.dispatchToChannels({
      settings,
      channelKey: 'saleChannels',
      contact: {
        email: order.customer?.email,
        phone: order.customer?.phone,
      },
      templateKey: TemplateKey.SALE_CONFIRMED,
      variables: vars,
      referenceId: order.id,
    });
  }

  async checkLowStock(variantId: string, warehouseId: string, branchId?: string | null) {
    const settings = await this.settingsService.getNotificationSettings();
    if (!settings.notifyOnLowStock) return;

    const threshold = settings.lowStockThreshold ?? 5;
    const stock = await this.prisma.stockLevel.findFirst({
      where: { variantId, warehouseId },
    });
    if (!stock || stock.availableQuantity > threshold) return;

    const managerContact = await this.resolveManagerContact();
    if (!managerContact.email && !managerContact.phone) {
      this.logger.warn('[LowStock] No manager contact configured — skipping alert');
      return;
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    const branch = branchId
      ? await this.prisma.branch.findUnique({ where: { id: branchId } })
      : await this.prisma.warehouse.findUnique({ where: { id: warehouseId }, include: { branch: true } }).then(w => w?.branch);

    const vars = {
      productName: variant?.product?.name || variantId,
      sku:           variant?.sku || 'N/A',
      quantity:      String(stock.availableQuantity),
      branchName:    branch?.name || 'Sucursal',
    };

    await this.dispatchToChannels({
      settings,
      channelKey: 'lowStockChannels',
      contact: managerContact,
      templateKey: TemplateKey.LOW_STOCK_ALERT,
      variables: vars,
      referenceId: variantId,
    });

    void this.staffInbox.create({
      title: 'Stock bajo',
      body: `${variant?.product?.name || variantId} (SKU ${variant?.sku}) — ${stock.availableQuantity} u. en ${branch?.name || 'sucursal'}`,
      event: TemplateKey.LOW_STOCK_ALERT,
      referenceId: variantId,
    });
  }

  async onPurchaseOrderIssued(poId: string) {
    const settings = await this.settingsService.getNotificationSettings();
    if (!settings.notifyOnPurchase) return;

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { supplier: true },
    });
    if (!po?.supplier) return;

    const general = await this.settingsService.getGeneralSettings();
    await this.dispatchToChannels({
      settings,
      channelKey: 'purchaseChannels',
      contact: {
        email: po.supplier.email,
        phone: po.supplier.phone,
      },
      templateKey: TemplateKey.PURCHASE_ORDER_ISSUED,
      variables: {
        supplierName: po.supplier.companyName,
        orderId:      this.shortId(po.id),
        total:        this.formatMoney(po.totalAmount),
        companyName:  general.companyName || 'Vestix',
      },
      referenceId: po.id,
    });
  }

  async onGoodsReceiptReceived(receiptId: string, branchName: string) {
    const settings = await this.settingsService.getNotificationSettings();
    if (!settings.notifyOnPurchase) return;

    const receipt = await this.prisma.goodsReceipt.findUnique({
      where: { id: receiptId },
      include: { purchaseOrder: true },
    });
    if (!receipt) return;

    const managerContact = await this.resolveManagerContact();
    if (!managerContact.email && !managerContact.phone) return;

    await this.dispatchToChannels({
      settings,
      channelKey: 'purchaseChannels',
      contact: managerContact,
      templateKey: TemplateKey.GOODS_RECEIPT_RECEIVED,
      variables: {
        orderId:    this.shortId(receipt.purchaseOrderId),
        branchName,
        date:       new Date().toLocaleDateString('es-AR'),
      },
      referenceId: receipt.id,
    });
  }

  async onTransferDispatched(transferId: string) {
    const settings = await this.settingsService.getNotificationSettings();
    if (!settings.notifyOnTransfer) return;

    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return;

    const [sourceWarehouse, destWarehouse] = await Promise.all([
      this.prisma.warehouse.findUnique({
        where: { id: transfer.sourceWarehouseId },
        include: { branch: true },
      }),
      this.prisma.warehouse.findUnique({
        where: { id: transfer.destinationWarehouseId },
        include: { branch: true },
      }),
    ]);

    const managerContact = await this.resolveManagerContact();
    if (!managerContact.email && !managerContact.phone) return;

    await this.dispatchToChannels({
      settings,
      channelKey: 'transferChannels',
      contact: managerContact,
      templateKey: TemplateKey.TRANSFER_DISPATCHED,
      variables: {
        sourceBranch:      sourceWarehouse?.branch?.name || sourceWarehouse?.name || 'Origen',
        destinationBranch: destWarehouse?.branch?.name || destWarehouse?.name || 'Destino',
        branchName:        sourceWarehouse?.branch?.name || 'Sucursal',
        date:              new Date().toLocaleDateString('es-AR'),
      },
      referenceId: transfer.id,
    });
  }

  async onTransferReceived(transferId: string) {
    const settings = await this.settingsService.getNotificationSettings();
    if (!settings.notifyOnTransfer) return;

    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return;

    const destWarehouse = await this.prisma.warehouse.findUnique({
      where: { id: transfer.destinationWarehouseId },
      include: { branch: true },
    });

    const managerContact = await this.resolveManagerContact();
    if (!managerContact.email && !managerContact.phone) return;

    await this.dispatchToChannels({
      settings,
      channelKey: 'transferChannels',
      contact: managerContact,
      templateKey: TemplateKey.TRANSFER_RECEIVED,
      variables: {
        destinationBranch: destWarehouse?.branch?.name || destWarehouse?.name || 'Destino',
        branchName:        destWarehouse?.branch?.name || 'Sucursal',
        date:              new Date().toLocaleDateString('es-AR'),
      },
      referenceId: transfer.id,
    });
  }

  // ─── Delivery / shipping events ────────────────────────────────────────────

  async onOrderShipped(
    saleOrderId: string,
    payload: {
      customerName: string;
      customerPhone: string;
      orderRef: string;
      courierName: string;
      trackingNumber: string;
      trackingUrl: string;
    },
  ) {
    const settings = await this.settingsService.getNotificationSettings();
    if (settings.notifyOnDelivery === false) return;

    await this.dispatchToChannels({
      settings,
      channelKey: 'deliveryChannels',
      contact: {
        email: await this.resolveCustomerEmail(saleOrderId),
        phone: payload.customerPhone,
      },
      templateKey: TemplateKey.ORDER_SHIPPED,
      variables: {
        customerName: payload.customerName,
        orderId: payload.orderRef,
        courierName: payload.courierName,
        trackingNumber: payload.trackingNumber,
        trackingUrl: payload.trackingUrl,
      },
      referenceId: saleOrderId,
    });

    void this.staffInbox.create({
      title: 'Pedido despachado',
      body: `Pedido #${payload.orderRef} despachado con ${payload.courierName}`,
      event: TemplateKey.ORDER_SHIPPED,
      referenceId: saleOrderId,
    });
  }

  async onDeliveryOtp(
    saleOrderId: string,
    payload: { customerPhone: string; orderRef: string; otpCode: string },
  ) {
    const settings = await this.settingsService.getNotificationSettings();
    if (settings.notifyOnDelivery === false) return;

    await this.dispatchToChannels({
      settings,
      channelKey: 'deliveryChannels',
      contact: { phone: payload.customerPhone },
      templateKey: TemplateKey.DELIVERY_OTP,
      variables: { orderId: payload.orderRef, otpCode: payload.otpCode },
      referenceId: `${saleOrderId}:delivery-otp`,
    });
  }

  async onDeliveryArrived(saleOrderId: string) {
    const settings = await this.settingsService.getNotificationSettings();
    if (settings.notifyOnDelivery === false) return;

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: { customer: true },
    });
    if (!order?.customer) return;

    await this.dispatchToChannels({
      settings,
      channelKey: 'deliveryChannels',
      contact: {
        email: order.customer.email,
        phone: order.customer.phone,
      },
      templateKey: TemplateKey.DELIVERY_ARRIVED,
      variables: {
        customerName: order.customer.fullName,
        orderId: this.shortId(order.id),
      },
      referenceId: saleOrderId,
    });
  }

  async onOrderDelivered(saleOrderId: string) {
    const settings = await this.settingsService.getNotificationSettings();
    if (settings.notifyOnDelivery === false) return;

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: { customer: true },
    });
    if (!order?.customer) return;

    await this.dispatchToChannels({
      settings,
      channelKey: 'deliveryChannels',
      contact: {
        email: order.customer.email,
        phone: order.customer.phone,
      },
      templateKey: TemplateKey.ORDER_DELIVERED,
      variables: {
        customerName: order.customer.fullName,
        orderId: this.shortId(order.id),
      },
      referenceId: saleOrderId,
    });

    void this.staffInbox.create({
      title: 'Entrega confirmada',
      body: `Pedido #${this.shortId(order.id)} entregado a ${order.customer.fullName}`,
      event: TemplateKey.ORDER_DELIVERED,
      referenceId: saleOrderId,
    });
  }

  async onShiftClosed(shiftId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: {
        openedByUser: { select: { fullName: true, email: true } },
        cashRegister: { include: { branch: true } },
      },
    });
    if (!shift || shift.difference == null || shift.difference === 0) return;

    const managerEmail = await this.resolveManagerEmail();
    if (!managerEmail) return;

    await this.notifications.notifyShiftDiscrepancy(managerEmail, {
      branchName:   shift.cashRegister.branch?.name || 'Sucursal',
      cashierName:  shift.openedByUser?.fullName || 'Cajero',
      registerName: shift.cashRegister.name,
      difference:   this.formatMoney(shift.difference),
      expected:     this.formatMoney(shift.expectedAmount ?? 0),
      actual:       this.formatMoney(shift.closingAmount ?? 0),
    });

    void this.staffInbox.create({
      title: 'Diferencia de caja',
      body: `${shift.cashRegister.name}: diferencia $${this.formatMoney(shift.difference)} (esperado $${this.formatMoney(shift.expectedAmount ?? 0)}, contado $${this.formatMoney(shift.closingAmount ?? 0)})`,
      event: TemplateKey.SHIFT_CLOSING_DISCREPANCY,
      referenceId: shiftId,
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async dispatchToChannels(params: {
    settings: Awaited<ReturnType<SettingsService['getNotificationSettings']>>;
    channelKey: 'saleChannels' | 'purchaseChannels' | 'deliveryChannels' | 'lowStockChannels' | 'transferChannels';
    contact: ContactRecipients;
    templateKey: TemplateKey;
    variables: Record<string, string>;
    referenceId?: string;
  }) {
    const channels = getEventChannels(params.settings, params.channelKey);

    for (const channel of channels) {
      const recipient = resolveRecipient(
        channel,
        params.contact,
        (phone) => this.normalizePhone(phone),
      );
      if (!recipient) continue;

      await this.notifications.enqueue({
        channel,
        templateKey: params.templateKey,
        recipient,
        variables: params.variables,
        referenceId: params.referenceId,
      });
    }
  }

  private async resolveManagerContact(): Promise<ContactRecipients> {
    const [general, notifications] = await Promise.all([
      this.settingsService.getGeneralSettings(),
      this.settingsService.getNotificationSettings(),
    ]);
    return {
      email: general.email || notifications.smtpUser || null,
      phone: general.phone || null,
    };
  }

  private async resolveAccount(accountId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: accountId } });
    if (customer) {
      return {
        id:            customer.id,
        entityName:    customer.fullName,
        balance:       customer.usedCredit,
        overdueAmount: this.customerOverdue(customer.usedCredit, customer.creditLimit),
      };
    }

    const supplier = await this.prisma.supplier.findUnique({ where: { id: accountId } });
    if (supplier) {
      return {
        id:            supplier.id,
        entityName:    supplier.companyName,
        balance:       supplier.balance,
        overdueAmount: supplier.balance,
      };
    }

    throw new NotFoundException('Cuenta corriente no encontrada');
  }

  private customerOverdue(usedCredit: number, creditLimit: number): number {
    if (creditLimit > 0 && usedCredit > creditLimit) {
      return usedCredit - creditLimit;
    }
    return usedCredit > 0 ? usedCredit : 0;
  }

  private async resolveManagerEmail(): Promise<string | null> {
    const contact = await this.resolveManagerContact();
    return contact.email || null;
  }

  private formatMoney(amount: number): string {
    return amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private shortId(id: string): string {
    return id.split('-')[0].toUpperCase();
  }

  private normalizePhone(raw?: string | null): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) return null;
    if (digits.startsWith('549') && digits.length >= 12) return digits;
    if (digits.startsWith('54') && digits.length >= 11) return digits;
    if (digits.startsWith('0') && digits.length >= 10) return '54' + digits.slice(1);
    if (digits.length >= 8 && digits.length <= 11) return '549' + digits;
    return digits;
  }

  private async resolveCustomerEmail(saleOrderId: string): Promise<string | null> {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: { customer: true },
    });
    return order?.customer?.email || null;
  }
}
