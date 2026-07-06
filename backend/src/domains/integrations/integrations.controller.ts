import { Controller, Post, Headers, Body, RawBodyRequest, Req, Get, Query, Param, Patch } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { Request } from 'express';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@Controller('integrations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'System' })
  async getIntegrations() {
    return this.integrationsService.getAllIntegrations();
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'System' })
  async getIntegration(@Param('id') id: string) {
    return this.integrationsService.getIntegration(id);
  }

  @Patch(':id/config')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async saveConfig(@Param('id') id: string, @Body('config') config: Record<string, string>) {
    return this.integrationsService.saveConfig(id, config);
  }

  @Patch(':id/toggle')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.integrationsService.toggleActive(id, isActive);
  }

  @Post(':id/test')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testConnection(@Param('id') id: string) {
    return this.integrationsService.testConnection(id);
  }

  @Post(':id/sync')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async triggerSync(@Param('id') id: string) {
    return this.integrationsService.triggerSync(id);
  }

  @Get(':id/webhook-logs')
  @RequirePermissions({ action: 'read', subject: 'System' })
  async getWebhookLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('success') success?: string,
    @Query('direction') direction?: string,
  ) {
    const isSuccess = success === 'true' ? true : (success === 'false' ? false : undefined);
    return this.integrationsService.getLogs(id, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      success: isSuccess,
      direction,
    });
  }

  @Post(':id/webhook-logs/:logId/retry')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async retryWebhook(@Param('id') id: string, @Param('logId') logId: string) {
    return this.integrationsService.retryLog(id, logId);
  }

  @Get('woocommerce/mappings')
  @RequirePermissions({ action: 'read', subject: 'System' })
  async getWcMappings() {
    return this.integrationsService.getWcMappings();
  }

  @Post('woocommerce/mappings')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async saveWcMapping(
    @Body('variantId') variantId: string,
    @Body('wcProductId') wcProductId: number,
    @Body('wcVariationId') wcVariationId: number,
  ) {
    return this.integrationsService.saveWcMapping(variantId, Number(wcProductId), Number(wcVariationId));
  }

  @Post('woocommerce/mappings/delete')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async deleteWcMapping(@Body('variantId') variantId: string) {
    return this.integrationsService.deleteWcMapping(variantId);
  }

  @Get('mercadolibre/mappings')
  @RequirePermissions({ action: 'read', subject: 'System' })
  async getMlMappings() {
    return this.integrationsService.getMlMappings();
  }

  @Post('mercadolibre/mappings')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async saveMlMapping(
    @Body('variantId') variantId: string,
    @Body('mlItemId') mlItemId: string,
    @Body('mlVariationId') mlVariationId?: string,
  ) {
    return this.integrationsService.saveMlMapping(variantId, mlItemId, mlVariationId);
  }

  @Post('mercadolibre/mappings/delete')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async deleteMlMapping(@Body('variantId') variantId: string) {
    return this.integrationsService.deleteMlMapping(variantId);
  }

  @Post('mercadolibre/webhook')
  async receiveMlWebhook(
    @Headers('x-ml-topic') topic: string,
    @Body() payload: any,
  ) {
    const resource = payload?.resource || payload?.id || '';
    return this.integrationsService.handleMlWebhook(topic, resource, payload);
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
