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
const redis_module_1 = require("./core/redis/redis.module");
const bullmq_1 = require("@nestjs/bullmq");
const identity_module_1 = require("./domains/identity/identity.module");
const setup_module_1 = require("./domains/setup/setup.module");
const catalog_module_1 = require("./domains/catalog/catalog.module");
const sales_module_1 = require("./domains/sales/sales.module");
const logistics_module_1 = require("./domains/logistics/logistics.module");
const procurement_module_1 = require("./domains/procurement/procurement.module");
const finance_module_1 = require("./domains/finance/finance.module");
const invoicing_module_1 = require("./domains/invoicing/invoicing.module");
const notifications_module_1 = require("./domains/notifications/notifications.module");
const integrations_module_1 = require("./domains/integrations/integrations.module");
const audit_module_1 = require("./modules/audit/audit.module");
const health_module_1 = require("./modules/health/health.module");
const settings_module_1 = require("./modules/settings/settings.module");
const reports_module_1 = require("./modules/reports/reports.module");
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
            redis_module_1.RedisModule,
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: process.env.REDIS_HOST || '127.0.0.1',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                },
            }),
            identity_module_1.IdentityModule,
            setup_module_1.SetupModule,
            catalog_module_1.CatalogModule,
            sales_module_1.SalesModule,
            logistics_module_1.LogisticsModule,
            procurement_module_1.ProcurementModule,
            finance_module_1.FinanceModule,
            invoicing_module_1.InvoicingModule,
            notifications_module_1.NotificationsModule,
            integrations_module_1.IntegrationsModule,
            audit_module_1.AuditModule,
            health_module_1.HealthModule,
            settings_module_1.SettingsModule,
            reports_module_1.ReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map