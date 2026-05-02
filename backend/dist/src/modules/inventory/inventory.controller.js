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
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getStockLevels(query) {
        return this.inventoryService.findAllStock(query);
    }
    adjustStock(dto) {
        return this.inventoryService.adjustStock(dto);
    }
    async getMovements(query) {
        const res = await this.inventoryService.findAllMovements(query);
        return res.data;
    }
    getAllMovements(query) {
        return this.inventoryService.findAllMovements(query);
    }
    getTransfers(page, pageSize) {
        return { data: [], total: 0 };
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
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getTransfers", null);
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
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map