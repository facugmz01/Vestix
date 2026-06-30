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
exports.StorefrontAuthController = void 0;
const common_1 = require("@nestjs/common");
const storefront_auth_service_1 = require("../services/storefront-auth.service");
let StorefrontAuthController = class StorefrontAuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async requestOtp(phone) {
        return this.authService.requestOtp(phone);
    }
    async verifyOtp(phone, code, res) {
        const result = await this.authService.verifyOtp(phone, code);
        res.cookie('storefront_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });
        return { success: true, customer: result.customer };
    }
    async logout(res) {
        res.clearCookie('storefront_token', { path: '/' });
        return { success: true };
    }
    async me(req) {
        const token = req.cookies?.['storefront_token'];
        if (!token)
            return { authenticated: false };
        return { authenticated: true };
    }
};
exports.StorefrontAuthController = StorefrontAuthController;
__decorate([
    (0, common_1.Post)('send-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('phone')),
    __param(1, (0, common_1.Body)('code')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('me'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "me", null);
exports.StorefrontAuthController = StorefrontAuthController = __decorate([
    (0, common_1.Controller)('storefront/auth'),
    __metadata("design:paramtypes", [storefront_auth_service_1.StorefrontAuthService])
], StorefrontAuthController);
//# sourceMappingURL=storefront-auth.controller.js.map