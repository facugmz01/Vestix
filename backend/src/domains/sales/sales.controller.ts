import { Controller, Post, Body, Get, Query, Param, Req, Patch } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { NotificationTriggersService } from '../notifications/notification-triggers.service';
import { ShippingService } from '../shipping/shipping.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { BulkImportSalesDto } from './dto/bulk-sales.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

@Controller('sales')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
    private readonly notificationTriggers: NotificationTriggersService,
    private readonly shippingService: ShippingService,
  ) {}

  @Post('checkout')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async checkout(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    return this.checkoutOrchestrator.processCheckout(createOrderDto, req.user?.userId);
  }

  @Post('orders/:id/confirm-payment')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  async confirmPayment(@Param('id') id: string, @Body() body: ConfirmPaymentDto) {
    const order = await this.checkoutOrchestrator.confirmPayment(id, body.paymentReference);
    if (order.source === 'ECOMMERCE') {
      await this.shippingService.markFulfillmentPaid(order.id);
    }
    return order;
  }

  @Patch(':id/status')
  @RequirePermissions({ action: 'manage', subject: 'Sales' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.salesService.updateOrderStatus(id, body.status);
  }

  @Post('bulk-import')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async bulkImportSales(@Body() dto: BulkImportSalesDto) {
    return this.salesService.bulkImportSales(dto);
  }

  @Get('orders')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getOrders(@Query() query: any) {
    return this.salesService.getOrders(query);
  }

  @Get('orders/:id')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getOrder(@Param('id') id: string) {
    return this.salesService.getOrderById(id);
  }

  @Post('orders/:id/confirm')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  async confirmOrder(@Param('id') id: string) {
    return this.checkoutOrchestrator.confirmQuotation(id);
  }

  @Post('orders/:id/cancel')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  async cancelOrder(@Param('id') id: string) {
    const order = await this.checkoutOrchestrator.cancelOrder(id);
    await this.shippingService.cancelFulfillment(id);
    return order;
  }

  @Post('orders/:id/send-receipt')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  sendManualReceipt(
    @Param('id') id: string,
    @Body() body: { channel: 'EMAIL' | 'WHATSAPP'; recipient: string },
  ) {
    return this.notificationTriggers.sendManualSaleReceipt(id, body.channel, body.recipient);
  }
}
