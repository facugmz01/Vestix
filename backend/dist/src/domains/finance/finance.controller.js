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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../../core/rbac/guards/permissions.guard");
const accounts_service_1 = require("./accounts.service");
const cash_service_1 = require("./cash/cash.service");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let FinanceController = class FinanceController {
    constructor(accountsService, cashService) {
        this.accountsService = accountsService;
        this.cashService = cashService;
    }
    getCurrentAccounts(page, pageSize) {
        return { data: [], total: 0 };
    }
    getAccounts() {
        return this.accountsService.getAccounts();
    }
    getPaymentMethods() {
        return this.accountsService.getPaymentMethods();
    }
    createPaymentMethod(body) {
        return this.accountsService.createPaymentMethod(body);
    }
    updatePaymentMethod(id, body) {
        return this.accountsService.updatePaymentMethod(id, body);
    }
    getActiveShift(req) {
        return this.cashService.getActiveShiftForUser(req.user.userId);
    }
    openShift(req, body) {
        return this.cashService.openShift(body.cashRegisterId, req.user.userId, body.openingAmount);
    }
    closeShift(req, body) {
        return this.cashService.closeShift(body.shiftId, req.user.userId, body.closingAmount, body.notes);
    }
    getShifts(page, pageSize) {
        return this.cashService.getShifts(Number(page) || 1, Number(pageSize) || 15);
    }
    getShiftById(id) {
        return this.cashService.getShiftById(id);
    }
    getShiftMovements(id) {
        return this.cashService.getShiftMovements(id);
    }
    addManualMovement(req, id, body) {
        return this.cashService.addManualMovement(id, req.user.userId, body.type, body.amount, body.concept);
    }
    getPayments(page, pageSize) {
        return { data: [], total: 0 };
    }
    getInvoices(page, pageSize) {
        return { data: [], total: 0 };
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('current-accounts'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getCurrentAccounts", null);
__decorate([
    (0, common_1.Get)('treasury/accounts'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Get)('payment-methods'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Post)('payment-methods'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createPaymentMethod", null);
__decorate([
    (0, common_1.Patch)('payment-methods/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updatePaymentMethod", null);
__decorate([
    (0, common_1.Get)('treasury/shifts/active'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getActiveShift", null);
__decorate([
    (0, common_1.Post)('treasury/shifts/open'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Finance' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "openShift", null);
__decorate([
    (0, common_1.Post)('treasury/shifts/close'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Finance' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "closeShift", null);
__decorate([
    (0, common_1.Get)('treasury/shifts'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getShifts", null);
__decorate([
    (0, common_1.Get)('treasury/shifts/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getShiftById", null);
__decorate([
    (0, common_1.Get)('treasury/shifts/:id/movements'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getShiftMovements", null);
__decorate([
    (0, common_1.Post)('treasury/shifts/:id/movements'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Finance' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "addManualMovement", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Finance' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getInvoices", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService,
        cash_service_1.CashService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map