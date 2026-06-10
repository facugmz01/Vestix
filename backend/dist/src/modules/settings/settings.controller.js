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
const settings_service_1 = require("./settings.service");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getSettings() {
        return await this.settingsService.getSettings();
    }
    async updateGeneral(dto, req) {
        return await this.settingsService.updateSection('general', dto, req.user?.id ?? 'unknown');
    }
    async updatePricing(dto, req) {
        return await this.settingsService.updateSection('pricing', dto, req.user?.id ?? 'unknown');
    }
    async updateSkuBarcode(dto, req) {
        return await this.settingsService.updateSection('skuBarcode', dto, req.user?.id ?? 'unknown');
    }
    async updateInvoicing(dto, req) {
        return await this.settingsService.updateSection('invoicing', dto, req.user?.id ?? 'unknown');
    }
    async updateNotifications(dto, req) {
        return await this.settingsService.updateSection('notifications', dto, req.user?.id ?? 'unknown');
    }
    async updateIntegrations(dto, req) {
        return await this.settingsService.updateSection('integrations', dto, req.user?.id ?? 'unknown');
    }
    async updateOffline(dto, req) {
        return await this.settingsService.updateSection('offline', dto, req.user?.id ?? 'unknown');
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
    (0, common_1.Patch)('general'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateGeneral", null);
__decorate([
    (0, common_1.Patch)('pricing'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updatePricing", null);
__decorate([
    (0, common_1.Patch)('sku-barcode'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateSkuBarcode", null);
__decorate([
    (0, common_1.Patch)('invoicing'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateInvoicing", null);
__decorate([
    (0, common_1.Patch)('notifications'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateNotifications", null);
__decorate([
    (0, common_1.Patch)('integrations'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateIntegrations", null);
__decorate([
    (0, common_1.Patch)('offline'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateOffline", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map