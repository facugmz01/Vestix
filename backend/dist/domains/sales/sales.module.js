"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const sales_service_1 = require("./sales.service");
const sales_controller_1 = require("./sales.controller");
const returns_controller_1 = require("./returns/returns.controller");
const returns_service_1 = require("./returns/returns.service");
const orders_fulfillment_service_1 = require("./orders/orders-fulfillment.service");
const checkout_orchestrator_1 = require("./checkout.orchestrator");
const sale_order_repository_1 = require("./repositories/sale-order.repository");
const storefront_controller_1 = require("./storefront.controller");
const storefront_auth_controller_1 = require("./storefront-auth.controller");
const storefront_jwt_strategy_1 = require("./storefront-jwt.strategy");
const mercadopago_service_1 = require("./mercadopago.service");
const customers_service_1 = require("./customers.service");
const customers_controller_1 = require("./customers.controller");
const pos_service_1 = require("./pos.service");
const pos_controller_1 = require("./pos.controller");
const cash_registers_controller_1 = require("./cash-registers.controller");
const sync_engine_service_1 = require("./sync-engine.service");
const conflict_resolution_service_1 = require("./conflict-resolution.service");
const offline_controller_1 = require("./offline.controller");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '7d' },
            }),
        ],
        controllers: [
            sales_controller_1.SalesController,
            returns_controller_1.ReturnsController,
            storefront_controller_1.StorefrontController,
            storefront_auth_controller_1.StorefrontAuthController,
            customers_controller_1.CustomersController,
            pos_controller_1.PosController,
            cash_registers_controller_1.CashRegistersController,
            offline_controller_1.OfflineController,
        ],
        providers: [
            sales_service_1.SalesService,
            returns_service_1.ReturnsService,
            orders_fulfillment_service_1.OrdersFulfillmentService,
            checkout_orchestrator_1.CheckoutOrchestrator,
            storefront_jwt_strategy_1.StorefrontJwtStrategy,
            mercadopago_service_1.MercadoPagoService,
            customers_service_1.CustomersService,
            pos_service_1.PosService,
            sync_engine_service_1.SyncEngineService,
            conflict_resolution_service_1.ConflictResolutionService,
            sale_order_repository_1.SaleOrderRepository,
        ],
        exports: [
            sales_service_1.SalesService,
            returns_service_1.ReturnsService,
            orders_fulfillment_service_1.OrdersFulfillmentService,
            checkout_orchestrator_1.CheckoutOrchestrator,
            customers_service_1.CustomersService,
            pos_service_1.PosService,
            sync_engine_service_1.SyncEngineService,
            sale_order_repository_1.SaleOrderRepository,
        ],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map