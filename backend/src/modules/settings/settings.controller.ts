import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @RequirePermissions({ action: 'manage', subject: 'Settings' }) // Super Admin only
  updateSettings(@Body() dto: UpdateSettingsDto, @Req() req: any) {
    return this.settingsService.updateSettings(dto, req.user?.id ?? 'unknown');
  }

  @Patch('offline')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  updateOfflineSettings(@Body() dto: any, @Req() req: any) {
    return this.settingsService.updateSettings({ offline: dto }, req.user?.id ?? 'unknown');
  }

  @Patch('store')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  updateStoreSettings(@Body() dto: any, @Req() req: any) {
    return this.settingsService.updateSettings({ store: dto }, req.user?.id ?? 'unknown');
  }
}
