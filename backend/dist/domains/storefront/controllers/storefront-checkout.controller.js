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
exports.StorefrontCheckoutController = void 0;
const common_1 = require("@nestjs/common");
const storefront_checkout_service_1 = require("../services/storefront-checkout.service");
const jwt_1 = require("@nestjs/jwt");
let StorefrontCheckoutController = class StorefrontCheckoutController {
    constructor(checkoutService, jwtService) {
        this.checkoutService = checkoutService;
        this.jwtService = jwtService;
    }
    async processCheckout(req, dto) {
        let customerId = null;
        try {
            const token = req.cookies?.['storefront_token'] || req.headers.authorization?.split(' ')[1];
            if (token) {
                const payload = await this.jwtService.verifyAsync(token, {
                    secret: process.env.JWT_SECRET || 'super_secret_dev_key',
                });
                if (payload.type === 'CUSTOMER') {
                    customerId = payload.sub;
                }
            }
        }
        catch (e) {
        }
        return this.checkoutService.processCheckout(customerId, dto);
    }
};
exports.StorefrontCheckoutController = StorefrontCheckoutController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StorefrontCheckoutController.prototype, "processCheckout", null);
exports.StorefrontCheckoutController = StorefrontCheckoutController = __decorate([
    (0, common_1.Controller)('storefront/checkout'),
    __metadata("design:paramtypes", [storefront_checkout_service_1.StorefrontCheckoutService,
        jwt_1.JwtService])
], StorefrontCheckoutController);
//# sourceMappingURL=storefront-checkout.controller.js.map