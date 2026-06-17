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
exports.AfipController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
const permissions_guard_1 = require("../../core/rbac/guards/permissions.guard");
const passport_1 = require("@nestjs/passport");
const common_2 = require("@nestjs/common");
let AfipController = class AfipController {
    constructor(invoiceQueue) {
        this.invoiceQueue = invoiceQueue;
    }
    async getFailedJobs() {
        const failedJobs = await this.invoiceQueue.getFailed();
        return failedJobs.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
            failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : new Date().toISOString(),
        }));
    }
    async retryJob(id) {
        const job = await this.invoiceQueue.getJob(id);
        if (!job) {
            throw new common_1.NotFoundException(`Trabajo con ID ${id} no encontrado en la cola.`);
        }
        await job.retry();
        return { success: true, message: `Trabajo ${id} re-encolado para facturación.` };
    }
};
exports.AfipController = AfipController;
__decorate([
    (0, common_1.Get)('failed-jobs'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'System' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AfipController.prototype, "getFailedJobs", null);
__decorate([
    (0, common_1.Post)('retry-job/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AfipController.prototype, "retryJob", null);
exports.AfipController = AfipController = __decorate([
    (0, common_1.Controller)('afip'),
    (0, common_2.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __param(0, (0, bullmq_1.InjectQueue)('afip_invoices')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], AfipController);
//# sourceMappingURL=afip.controller.js.map