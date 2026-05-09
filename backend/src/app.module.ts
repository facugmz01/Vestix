import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './core/rbac/rbac.module';

// --- Importación de todos los módulos del sistema ---
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SalesModule } from './modules/sales/sales.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { AfipModule } from './modules/afip/afip.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { BranchesModule } from './modules/branches/branches.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InvoicingModule } from './modules/invoicing/invoicing.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PosModule } from './modules/pos/pos.module';
import { IdentifiersModule } from './modules/identifiers/identifiers.module';

import { CatalogModule } from './modules/catalog/catalog.module';

@Module({
  imports: [
    // 1. Configuración y Seguridad
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 1000, // Aumentado para producción
    }]),
    
    // 2. Logging Estructurado (Pino)
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production' 
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),

    // 3. Base de Datos y Core
    PrismaModule,
    RbacModule,

    // 4. Módulos de Funcionalidad
    AuthModule,
    UsersModule,
    SalesModule,
    InventoryModule,
    FinanceModule,
    CustomersModule,
    PricingModule,
    AfipModule,
    AuditModule,
    HealthModule,
    ProductsModule,
    PurchasingModule,
    SettingsModule,
    ReportsModule,
    IntegrationsModule,
    BranchesModule,
    WarehousesModule,
    PaymentsModule,
    NotificationsModule,
    InvoicingModule,
    SuppliersModule,
    PosModule,
    IdentifiersModule,
    CatalogModule,
  ],
})
export class AppModule {}
