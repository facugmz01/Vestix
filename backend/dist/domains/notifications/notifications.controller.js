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
exports.NotificationsController = exports.SendTestNotificationDto = exports.ToggleTemplateDto = exports.UpdateTemplateDto = exports.CreateTemplateDto = void 0;
const common_1 = require("@nestjs/common");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
const notifications_service_1 = require("./notifications.service");
const whatsapp_evolution_service_1 = require("./channels/whatsapp-evolution.service");
const notification_model_1 = require("./models/notification.model");
const class_validator_1 = require("class-validator");
class CreateTemplateDto {
}
exports.CreateTemplateDto = CreateTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "event", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTemplateDto.prototype, "isActive", void 0);
class UpdateTemplateDto {
}
exports.UpdateTemplateDto = UpdateTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateTemplateDto.prototype, "isActive", void 0);
class ToggleTemplateDto {
}
exports.ToggleTemplateDto = ToggleTemplateDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ToggleTemplateDto.prototype, "isActive", void 0);
class SendTestNotificationDto {
}
exports.SendTestNotificationDto = SendTestNotificationDto;
__decorate([
    (0, class_validator_1.IsEnum)(notification_model_1.NotificationChannel),
    __metadata("design:type", String)
], SendTestNotificationDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendTestNotificationDto.prototype, "templateKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendTestNotificationDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendTestNotificationDto.prototype, "variables", void 0);
let NotificationsController = class NotificationsController {
    constructor(notificationsService, whatsappService) {
        this.notificationsService = notificationsService;
        this.whatsappService = whatsappService;
    }
    async getTemplates(page, pageSize, channel, isActiveRaw) {
        const isActive = isActiveRaw === 'true' ? true
            : isActiveRaw === 'false' ? false
                : undefined;
        return this.notificationsService.getTemplates({ page, pageSize, channel, isActive });
    }
    async getTemplate(id) {
        return this.notificationsService.getTemplate(id);
    }
    async createTemplate(data) {
        return this.notificationsService.createTemplate(data);
    }
    async updateTemplate(id, data) {
        return this.notificationsService.updateTemplate(id, data);
    }
    async toggleTemplate(id, dto) {
        return this.notificationsService.toggleTemplate(id, dto.isActive);
    }
    async getLogs(page, pageSize, status, channel, event, search) {
        return this.notificationsService.getLogs({ page, pageSize, status, channel, event, search });
    }
    async getQueue() {
        const queue = await this.notificationsService.getQueue();
        return { data: queue, total: queue.length };
    }
    async sendTest(body) {
        const job = await this.notificationsService.enqueue({
            channel: body.channel,
            templateKey: body.templateKey,
            recipient: body.recipient,
            variables: body.variables ?? {},
        });
        return {
            success: true,
            message: `Test notification enqueued. Job ID: ${job?.id ?? 'skipped'}`,
            job,
        };
    }
    getWhatsAppStatus() {
        return this.whatsappService.getStatus();
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('channel')),
    __param(3, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTemplateDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateTemplateDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id/toggle'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ToggleTemplateDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "toggleTemplate", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(15), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('channel')),
    __param(4, (0, common_1.Query)('event')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('queue'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendTestNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendTest", null);
__decorate([
    (0, common_1.Get)('whatsapp/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Integrations' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getWhatsAppStatus", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        whatsapp_evolution_service_1.WhatsAppEvolutionService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map