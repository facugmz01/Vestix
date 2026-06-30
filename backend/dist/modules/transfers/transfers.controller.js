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
exports.TransfersController = void 0;
const common_1 = require("@nestjs/common");
const transfers_service_1 = require("./transfers.service");
const transfer_dto_1 = require("./dto/transfer.dto");
const jwt_auth_guard_1 = require("../../core/auth/jwt-auth.guard");
const roles_guard_1 = require("../../core/rbac/roles.guard");
const roles_decorator_1 = require("../../core/rbac/roles.decorator");
let TransfersController = class TransfersController {
    constructor(transfersService) {
        this.transfersService = transfersService;
    }
    findAll(query) {
        return this.transfersService.findAll(query);
    }
    findOne(id) {
        return this.transfersService.findOne(id);
    }
    createTransfer(dto, req) {
        return this.transfersService.createTransfer(dto, req.user.sub);
    }
    dispatchTransfer(id) {
        return this.transfersService.dispatchTransfer(id);
    }
    receiveTransfer(id, dto) {
        return this.transfersService.receiveTransfer(id, dto);
    }
    cancelTransfer(id) {
        return this.transfersService.prisma.stockTransfer.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
};
exports.TransfersController = TransfersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_dto_1.CreateTransferDto, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "createTransfer", null);
__decorate([
    (0, common_1.Post)(':id/dispatch'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "dispatchTransfer", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transfer_dto_1.ReceiveTransferDto]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "receiveTransfer", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "cancelTransfer", null);
exports.TransfersController = TransfersController = __decorate([
    (0, common_1.Controller)('inventory/transfers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [transfers_service_1.TransfersService])
], TransfersController);
//# sourceMappingURL=transfers.controller.js.map