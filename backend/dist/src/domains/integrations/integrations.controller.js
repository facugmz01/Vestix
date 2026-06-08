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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const integrations_service_1 = require("./integrations.service");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let IntegrationsController = class IntegrationsController {
    constructor(integrationsService) {
        this.integrationsService = integrationsService;
    }
    async getIntegrations() {
        return this.integrationsService.getAllIntegrations();
    }
    async getIntegration(id) {
        return this.integrationsService.getIntegration(id);
    }
    async saveConfig(id, config) {
        return this.integrationsService.saveConfig(id, config);
    }
    async toggleActive(id, isActive) {
        return this.integrationsService.toggleActive(id, isActive);
    }
    async testConnection(id) {
        return this.integrationsService.testConnection(id);
    }
    async triggerSync(id) {
        return this.integrationsService.triggerSync(id);
    }
    async getWebhookLogs(id, page, pageSize, success, direction) {
        const isSuccess = success === 'true' ? true : (success === 'false' ? false : undefined);
        return this.integrationsService.getLogs(id, {
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            success: isSuccess,
            direction,
        });
    }
    async retryWebhook(id, logId) {
        return this.integrationsService.retryLog(id, logId);
    }
    async getWcMappings() {
        return this.integrationsService.getWcMappings();
    }
    async saveWcMapping(variantId, wcProductId, wcVariationId) {
        return this.integrationsService.saveWcMapping(variantId, Number(wcProductId), Number(wcVariationId));
    }
    async deleteWcMapping(variantId) {
        return this.integrationsService.deleteWcMapping(variantId);
    }
    async receiveWebhook(event, signature, payload, req) {
        return this.integrationsService.handleInboundWebhook(event, payload, signature, req.rawBody ?? Buffer.from(JSON.stringify(payload)));
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'System' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getIntegrations", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'System' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getIntegration", null);
__decorate([
    (0, common_1.Patch)(':id/config'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('config')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)(':id/sync'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "triggerSync", null);
__decorate([
    (0, common_1.Get)(':id/webhook-logs'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'System' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('success')),
    __param(4, (0, common_1.Query)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getWebhookLogs", null);
__decorate([
    (0, common_1.Post)(':id/webhook-logs/:logId/retry'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('logId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "retryWebhook", null);
__decorate([
    (0, common_1.Get)('woocommerce/mappings'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'System' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getWcMappings", null);
__decorate([
    (0, common_1.Post)('woocommerce/mappings'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)('variantId')),
    __param(1, (0, common_1.Body)('wcProductId')),
    __param(2, (0, common_1.Body)('wcVariationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "saveWcMapping", null);
__decorate([
    (0, common_1.Post)('woocommerce/mappings/delete'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)('variantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "deleteWcMapping", null);
__decorate([
    (0, common_1.Post)('woocommerce/webhook'),
    __param(0, (0, common_1.Headers)('x-wc-webhook-topic')),
    __param(1, (0, common_1.Headers)('x-wc-webhook-signature')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "receiveWebhook", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.Controller)('integrations'),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map