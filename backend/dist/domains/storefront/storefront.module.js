"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const storefront_auth_controller_1 = require("./controllers/storefront-auth.controller");
const storefront_checkout_controller_1 = require("./controllers/storefront-checkout.controller");
const storefront_auth_service_1 = require("./services/storefront-auth.service");
const storefront_checkout_service_1 = require("./services/storefront-checkout.service");
const customer_auth_guard_1 = require("./guards/customer-auth.guard");
let StorefrontModule = class StorefrontModule {
};
exports.StorefrontModule = StorefrontModule;
exports.StorefrontModule = StorefrontModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'super_secret_dev_key',
                signOptions: { expiresIn: '7d' },
            })
        ],
        controllers: [
            storefront_auth_controller_1.StorefrontAuthController,
            storefront_checkout_controller_1.StorefrontCheckoutController
        ],
        providers: [
            storefront_auth_service_1.StorefrontAuthService,
            storefront_checkout_service_1.StorefrontCheckoutService,
            customer_auth_guard_1.CustomerAuthGuard
        ],
        exports: [
            storefront_auth_service_1.StorefrontAuthService,
            storefront_checkout_service_1.StorefrontCheckoutService
        ]
    })
], StorefrontModule);
//# sourceMappingURL=storefront.module.js.map