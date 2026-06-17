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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
const inventory_service_1 = require("./inventory.service");
const transfers_service_1 = require("./transfers/transfers.service");
const permissions_guard_1 = require("../../core/rbac/guards/permissions.guard");
const passport_1 = require("@nestjs/passport");
const common_2 = require("@nestjs/common");
let InventoryController = class InventoryController {
    constructor(inventoryService, transfersService) {
        this.inventoryService = inventoryService;
        this.transfersService = transfersService;
    }
    getStockLevels(query) {
        return this.inventoryService.findAllStock(query);
    }
    adjustStock(body) {
        return this.inventoryService.recordMovement(body);
    }
    processStockAudit(body) {
        return this.inventoryService.processStockAudit(body);
    }
    async getMovements(query) {
        const res = await this.inventoryService.findAllMovements(query);
        return res.data;
    }
    getAllMovements(query) {
        return this.inventoryService.findAllMovements(query);
    }
    getTransfers(query) {
        return this.transfersService.findAll(query);
    }
    getTransfer(id) {
        return this.transfersService.findOne(id);
    }
    createTransfer(body) {
        return this.transfersService.createTransfer(body);
    }
    dispatchTransfer(id, body) {
        return this.transfersService.dispatchTransfer(id, body);
    }
    receiveTransfer(id, body) {
        return this.transfersService.receiveTransfer(id, body);
    }
    cancelTransfer(id) {
        return this.transfersService.cancelTransfer(id);
    }
    getReservations(page, pageSize) {
        return { data: [], total: 0 };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('stock'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Inventory' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStockLevels", null);
__decorate([
    (0, common_1.Post)('stock/adjust'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Inventory' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Post)('audit'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Inventory' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "processStockAudit", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Inventory' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Get)('movements/all'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Inventory' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAllMovements", null);
__decorate([
    (0, common_1.Get)('transfers'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Inventory' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getTransfers", null);
__decorate([
    (0, common_1.Get)('transfers/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Inventory' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getTransfer", null);
__decorate([
    (0, common_1.Post)('transfers'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Inventory' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createTransfer", null);
__decorate([
    (0, common_1.Post)('transfers/:id/dispatch'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Inventory' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "dispatchTransfer", null);
__decorate([
    (0, common_1.Post)('transfers/:id/receive'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Inventory' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "receiveTransfer", null);
__decorate([
    (0, common_1.Post)('transfers/:id/cancel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Inventory' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "cancelTransfer", null);
__decorate([
    (0, common_1.Get)('reservations'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Inventory' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getReservations", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_2.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        transfers_service_1.TransfersService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map