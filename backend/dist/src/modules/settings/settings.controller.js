"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../../core/rbac/guards/permissions.guard");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const settings_service_1 = require("./settings.service");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
const settings_dto_1 = require("./dto/settings.dto");
const VALID_SECTIONS = new Set([
    'general', 'pricing', 'skuBarcode', 'invoicing', 'notifications',
    'integrations', 'offline', 'pos', 'arca', 'storefront', 'pwa', 'qr',
]);
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getSettings() {
        return await this.settingsService.getSettings();
    }
    async patchSection(section, body, req) {
        if (!VALID_SECTIONS.has(section)) {
            throw new common_1.BadRequestException(`Invalid settings section: '${section}'. Valid sections: ${[...VALID_SECTIONS].join(', ')}`);
        }
        return await this.settingsService.updateSection(section, body, req.user?.userId ?? 'unknown');
    }
    async updateAllSettings(dto, req) {
        return await this.settingsService.updateAllSettings(dto, req.user?.userId ?? 'unknown');
    }
    async testAfipConnection() {
        return this.settingsService.testAfipConnection();
    }
    async testSmtpConnection(dto) {
        return this.settingsService.testSmtpConnection(dto);
    }
    async testSmsConnection(dto) {
        return this.settingsService.testSmsConnection(dto);
    }
    async testWhatsappConnection(dto) {
        return this.settingsService.testWhatsappConnection(dto);
    }
    async testPushConnection(dto) {
        return this.settingsService.testPushConnection(dto);
    }
    async uploadLogo(file, req) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        const logoUrl = `/uploads/logos/${file.filename}`;
        await this.settingsService.updateSection('general', { logoUrl }, req.user?.userId ?? 'unknown');
        return { logoUrl };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)(':section'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('section')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "patchSection", null);
__decorate([
    (0, common_1.Put)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.UpdateSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateAllSettings", null);
__decorate([
    (0, common_1.Post)('invoicing/test-afip'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "testAfipConnection", null);
__decorate([
    (0, common_1.Post)('notifications/test-smtp'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.TestSmtpDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "testSmtpConnection", null);
__decorate([
    (0, common_1.Post)('notifications/test-sms'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.TestSmsDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "testSmsConnection", null);
__decorate([
    (0, common_1.Post)('notifications/test-whatsapp'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.TestWhatsappDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "testWhatsappConnection", null);
__decorate([
    (0, common_1.Post)('notifications/test-push'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.TestPushDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "testPushConnection", null);
__decorate([
    (0, common_1.Post)('general/logo'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/logos',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `logo-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new common_1.BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 2 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "uploadLogo", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map