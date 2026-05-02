"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const mercado_pago_service_1 = require("./mercado-pago.service");
const sales_module_1 = require("../sales/sales.module");
const finance_module_1 = require("../finance/finance.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [sales_module_1.SalesModule, finance_module_1.FinanceModule],
        providers: [payments_service_1.PaymentsService, mercado_pago_service_1.MercadoPagoService],
        exports: [payments_service_1.PaymentsService]
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map