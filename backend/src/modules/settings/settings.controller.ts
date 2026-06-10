import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getSettings() {
    return await this.settingsService.getSettings();
  }

  @Patch('general')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateGeneral(@Body() dto: any, @Req() req: any) {
    return await this.settingsService.updateSection('general', dto, req.user?.id ?? 'unknown');
  }

  @Patch('pricing')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updatePricing(@Body() dto: any, @Req() req: any) {
    return await this.settingsService.updateSection('pricing', dto, req.user?.id ?? 'unknown');
  }

  @Patch('sku-barcode')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateSkuBarcode(@Body() dto: any, @Req() req: any) {
    return await this.settingsService.updateSection('skuBarcode', dto, req.user?.id ?? 'unknown');
  }

  @Patch('invoicing')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateInvoicing(@Body() dto: any, @Req() req: any) {
    return await this.settingsService.updateSection('invoicing', dto, req.user?.id ?? 'unknown');
  }

  @Patch('notifications')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateNotifications(@Body() dto: any, @Req() req: any) {
    return await this.settingsService.updateSection('notifications', dto, req.user?.id ?? 'unknown');
  }

  @Patch('integrations')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateIntegrations(@Body() dto: any, @Req() req: any) {
    return await this.settingsService.updateSection('integrations', dto, req.user?.id ?? 'unknown');
  }

  @Patch('offline')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateOffline(@Body() dto: any, @Req() req: any) {
    return await this.settingsService.updateSection('offline', dto, req.user?.id ?? 'unknown');
  }
}
