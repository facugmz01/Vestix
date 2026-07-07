import {
  Controller, Get, Body, Req, Post, Put, Patch,
  Param, UseInterceptors, UploadedFile,
  BadRequestException, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SettingsService } from './settings.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { UpdateSettingsDto, TestSmtpDto, TestSmsDto, TestWhatsappDto, TestPushDto } from './dto/settings.dto';

// Valid section keys — prevents arbitrary key injection
const VALID_SECTIONS = new Set([
  'general', 'pricing', 'skuBarcode', 'invoicing', 'notifications',
  'integrations', 'offline', 'pos', 'arca', 'storefront', 'pwa', 'qr', 'labelPrinting',
]);

@Controller('settings')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── GET /settings ──────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getSettings() {
    return await this.settingsService.getSettings();
  }

  // ── PATCH /settings/:section ───────────────────────────────────────────────
  // Preferred endpoint — updates only the specified section.
  // Example: PATCH /settings/notifications  { "evolutionApiUrl": "http://..." }

  @Patch(':section')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async patchSection(
    @Param('section') section: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    if (!VALID_SECTIONS.has(section)) {
      throw new BadRequestException(`Invalid settings section: '${section}'. Valid sections: ${[...VALID_SECTIONS].join(', ')}`);
    }
    return await this.settingsService.updateSection(section, body, req.user?.userId ?? 'unknown');
  }

  // ── PUT /settings ──────────────────────────────────────────────────────────
  // Legacy bulk update — kept for backward compatibility.
  // Prefer PATCH /settings/:section for new integrations.

  @Put()
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateAllSettings(@Body() dto: UpdateSettingsDto, @Req() req: any) {
    return await this.settingsService.updateAllSettings(dto, req.user?.userId ?? 'unknown');
  }

  // ── Connection Tests ───────────────────────────────────────────────────────

  @Post('invoicing/test-afip')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testAfipConnection() {
    return this.settingsService.testAfipConnection();
  }

  @Post('notifications/test-smtp')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testSmtpConnection(@Body() dto: TestSmtpDto) {
    return this.settingsService.testSmtpConnection(dto);
  }

  @Post('notifications/test-sms')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testSmsConnection(@Body() dto: TestSmsDto) {
    return this.settingsService.testSmsConnection(dto);
  }

  @Post('notifications/test-whatsapp')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testWhatsappConnection(@Body() dto: TestWhatsappDto) {
    return this.settingsService.testWhatsappConnection(dto);
  }

  @Post('notifications/test-push')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async testPushConnection(@Body() dto: TestPushDto) {
    return this.settingsService.testPushConnection(dto);
  }

  // ── Logo Upload ────────────────────────────────────────────────────────────

  @Post('general/logo')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/logos',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    const logoUrl = `/uploads/logos/${file.filename}`;
    await this.settingsService.updateSection('general', { logoUrl }, req.user?.userId ?? 'unknown');
    return { logoUrl };
  }
}
