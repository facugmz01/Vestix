import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { StoreSettingsService } from './store-settings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('storefront/settings')
export class StoreSettingsController {
  constructor(private readonly settingsService: StoreSettingsService) {}

  // Public endpoint for storefront frontend
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  // Protected endpoint for admin to update settings
  // Note: normally this would be under /admin/settings but for simplicity we put it here and protect it
  @Put()
  @UseGuards(AuthGuard('jwt'))
  updateSettings(@Body() data: any) {
    return this.settingsService.updateSettings(data);
  }
}
