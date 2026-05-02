import { Controller, Post, Headers, Body, RawBodyRequest, Req, Get, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { Request } from 'express';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'System' })
  getIntegrations(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return [];
  }

  /**
   * WooCommerce Webhook Receiver.
   * No RBAC: This endpoint must be publicly reachable by WooCommerce's servers.
   * Security is enforced via HMAC-SHA256 signature verification inside the service.
   *
   * Configure in WooCommerce Admin → Settings → Advanced → Webhooks
   */
  @Post('woocommerce/webhook')
  async receiveWebhook(
    @Headers('x-wc-webhook-topic') event: string,
    @Headers('x-wc-webhook-signature') signature: string,
    @Body() payload: any,
    @Req() req: RawBodyRequest<Request>, // Raw buffer required for HMAC verification
  ) {
    return this.integrationsService.handleInboundWebhook(
      event,
      payload,
      signature,
      req.rawBody ?? Buffer.from(JSON.stringify(payload)),
    );
  }
}
