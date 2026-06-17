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
exports.TreasuryController = void 0;
const common_1 = require("@nestjs/common");
const treasury_service_1 = require("./treasury.service");
const treasury_dto_1 = require("./dto/treasury.dto");
const jwt_auth_guard_1 = require("../../core/auth/jwt-auth.guard");
const roles_guard_1 = require("../../core/rbac/roles.guard");
const roles_decorator_1 = require("../../core/rbac/roles.decorator");
let TreasuryController = class TreasuryController {
    constructor(treasuryService) {
        this.treasuryService = treasuryService;
    }
    findAllShifts(query) {
        return this.treasuryService.findAllShifts(query);
    }
    getActiveShift(req) {
        return this.treasuryService.getActiveShift(req.user.sub);
    }
    findOneShift(id) {
        return this.treasuryService.findOneShift(id);
    }
    getShiftMovements(id) {
        return this.treasuryService.getShiftMovements(id);
    }
    createMovement(id, payload, req) {
        return this.treasuryService.createMovement(id, payload, req.user.sub);
    }
    openShift(dto, req) {
        return this.treasuryService.openShift(dto, req.user.sub);
    }
    closeShift(dto, req) {
        return this.treasuryService.closeShift(dto, req.user.sub);
    }
};
exports.TreasuryController = TreasuryController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Cashier'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findAllShifts", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Cashier'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getActiveShift", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Cashier'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findOneShift", null);
__decorate([
    (0, common_1.Get)(':id/movements'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Cashier'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getShiftMovements", null);
__decorate([
    (0, common_1.Post)(':id/movements'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Cashier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "createMovement", null);
__decorate([
    (0, common_1.Post)('open'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Cashier'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [treasury_dto_1.OpenShiftDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "openShift", null);
__decorate([
    (0, common_1.Post)('close'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Cashier'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [treasury_dto_1.CloseShiftDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "closeShift", null);
exports.TreasuryController = TreasuryController = __decorate([
    (0, common_1.Controller)('finance/treasury/shifts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [treasury_service_1.TreasuryService])
], TreasuryController);
//# sourceMappingURL=treasury.controller.js.map