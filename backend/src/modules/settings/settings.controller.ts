import { Controller, Get, Patch, Body, Req, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('invoicing/test-afip')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testAfipConnection() {
    return this.settingsService.testAfipConnection();
  }

  @Post('general/logo')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/logos',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const logoUrl = `/uploads/logos/${file.filename}`;
    await this.settingsService.updateSection('general', { logoUrl }, req.user?.id ?? 'unknown');
    return { logoUrl };
  }
}
