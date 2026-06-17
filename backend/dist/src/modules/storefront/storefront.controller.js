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
exports.StorefrontController = void 0;
const common_1 = require("@nestjs/common");
const storefront_service_1 = require("./storefront.service");
const checkout_dto_1 = require("./dto/checkout.dto");
const auth_dto_1 = require("./dto/auth.dto");
const customer_auth_guard_1 = require("../../core/auth/customer-auth.guard");
let StorefrontController = class StorefrontController {
    constructor(storefrontService) {
        this.storefrontService = storefrontService;
    }
    getPublicProducts(query) {
        return this.storefrontService.getPublicProducts(query);
    }
    getProduct(id) {
        return this.storefrontService.getProduct(id);
    }
    sendOtp(dto) {
        return this.storefrontService.sendOtp(dto.phone);
    }
    verifyOtp(dto) {
        return this.storefrontService.verifyOtp(dto.phone, dto.code);
    }
    getMe(req) {
        return this.storefrontService.getCustomer(req.user.sub);
    }
    logout() {
        return { success: true };
    }
    checkout(dto, req) {
        return this.storefrontService.checkout(dto, req.user?.sub);
    }
    getMyOrders(req, query) {
        return this.storefrontService.getMyOrders(req.user.sub, query);
    }
    getMyOrder(req, id) {
        return this.storefrontService.getMyOrder(req.user.sub, id);
    }
};
exports.StorefrontController = StorefrontController;
__decorate([
    (0, common_1.Get)('catalog/public'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "getPublicProducts", null);
__decorate([
    (0, common_1.Get)('catalog/public/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('storefront/auth/send-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SendOtpDto]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('storefront/auth/verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Get)('storefront/auth/me'),
    (0, common_1.UseGuards)(customer_auth_guard_1.CustomerAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('storefront/auth/logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('storefront/checkout'),
    (0, common_1.UseGuards)(customer_auth_guard_1.OptionalCustomerAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkout_dto_1.CheckoutDto, Object]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('storefront/my-orders'),
    (0, common_1.UseGuards)(customer_auth_guard_1.CustomerAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('storefront/my-orders/:id'),
    (0, common_1.UseGuards)(customer_auth_guard_1.CustomerAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StorefrontController.prototype, "getMyOrder", null);
exports.StorefrontController = StorefrontController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [storefront_service_1.StorefrontService])
], StorefrontController);
//# sourceMappingURL=storefront.controller.js.map