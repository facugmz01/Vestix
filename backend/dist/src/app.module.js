"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const prisma_module_1 = require("./core/prisma/prisma.module");
const rbac_module_1 = require("./core/rbac/rbac.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const sales_module_1 = require("./modules/sales/sales.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const finance_module_1 = require("./modules/finance/finance.module");
const customers_module_1 = require("./modules/customers/customers.module");
const pricing_module_1 = require("./modules/pricing/pricing.module");
const afip_module_1 = require("./modules/afip/afip.module");
const audit_module_1 = require("./modules/audit/audit.module");
const health_module_1 = require("./modules/health/health.module");
const products_module_1 = require("./modules/products/products.module");
const purchasing_module_1 = require("./modules/purchasing/purchasing.module");
const settings_module_1 = require("./modules/settings/settings.module");
const reports_module_1 = require("./modules/reports/reports.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const branches_module_1 = require("./modules/branches/branches.module");
const warehouses_module_1 = require("./modules/warehouses/warehouses.module");
const payments_module_1 = require("./modules/payments/payments.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const invoicing_module_1 = require("./modules/invoicing/invoicing.module");
const suppliers_module_1 = require("./modules/suppliers/suppliers.module");
const pos_module_1 = require("./modules/pos/pos.module");
const identifiers_module_1 = require("./modules/identifiers/identifiers.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 1000,
                }]),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                    transport: process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty', options: { colorize: true } }
                        : undefined,
                },
            }),
            prisma_module_1.PrismaModule,
            rbac_module_1.RbacModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            sales_module_1.SalesModule,
            inventory_module_1.InventoryModule,
            finance_module_1.FinanceModule,
            customers_module_1.CustomersModule,
            pricing_module_1.PricingModule,
            afip_module_1.AfipModule,
            audit_module_1.AuditModule,
            health_module_1.HealthModule,
            products_module_1.ProductsModule,
            purchasing_module_1.PurchasingModule,
            settings_module_1.SettingsModule,
            reports_module_1.ReportsModule,
            integrations_module_1.IntegrationsModule,
            branches_module_1.BranchesModule,
            warehouses_module_1.WarehousesModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            invoicing_module_1.InvoicingModule,
            suppliers_module_1.SuppliersModule,
            pos_module_1.PosModule,
            identifiers_module_1.IdentifiersModule,
            catalog_module_1.CatalogModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map