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
exports.OfflineController = void 0;
const common_1 = require("@nestjs/common");
const sync_engine_service_1 = require("./sync-engine.service");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
const common_2 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../../core/rbac/guards/permissions.guard");
let OfflineController = class OfflineController {
    constructor(syncEngine) {
        this.syncEngine = syncEngine;
    }
    processBatch(batch) {
        return this.syncEngine.processBatch(batch);
    }
    getLogs() {
        return this.syncEngine.getSyncLogs();
    }
};
exports.OfflineController = OfflineController;
__decorate([
    (0, common_1.Post)('sync'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Sync' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OfflineController.prototype, "processBatch", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sync' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OfflineController.prototype, "getLogs", null);
exports.OfflineController = OfflineController = __decorate([
    (0, common_1.Controller)('offline'),
    (0, common_2.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [sync_engine_service_1.SyncEngineService])
], OfflineController);
//# sourceMappingURL=offline.controller.js.map