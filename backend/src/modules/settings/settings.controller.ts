import { Controller, Get, Body, Req, Post, Put, UseInterceptors, UploadedFile, BadRequestException, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SettingsService } from './settings.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { UpdateSettingsDto } from './dto/settings.dto';

@Controller('settings')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getSettings() {
    return await this.settingsService.getSettings();
  }

  @Put()
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateAllSettings(@Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true })) dto: UpdateSettingsDto, @Req() req: any) {
    return await this.settingsService.updateAllSettings(dto, req.user?.userId ?? 'unknown');
  }

  @Post('invoicing/test-afip')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testAfipConnection() {
    return this.settingsService.testAfipConnection();
  }

  @Post('notifications/test-smtp')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testSmtpConnection(@Body() dto: any) {
    return this.settingsService.testSmtpConnection(dto);
  }

  @Post('notifications/test-sms')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testSmsConnection(@Body() dto: any) {
    return this.settingsService.testSmsConnection(dto);
  }

  @Post('notifications/test-whatsapp')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testWhatsappConnection(@Body() dto: any) {
    return this.settingsService.testWhatsappConnection(dto);
  }

  @Post('notifications/test-push')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testPushConnection(@Body() dto: any) {
    return this.settingsService.testPushConnection(dto);
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
    await this.settingsService.updateAllSettings({ general: { logoUrl } as any }, req.user?.userId ?? 'unknown');
    return { logoUrl };
  }

  @Post('reprice-usd')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async repriceUsd(@Body() dto: { type: 'Oficial' | 'Blue' }) {
    return this.settingsService.repriceUsd(dto.type);
  }
}
