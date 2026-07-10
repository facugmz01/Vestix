import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './core/rbac/rbac.module';
import { RedisModule } from './core/redis/redis.module';
import { OutboxModule } from './core/outbox/outbox.module';
import { BullModule } from '@nestjs/bullmq';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


// --- Importación de todos los módulos del sistema ---
import { IdentityModule } from './domains/identity/identity.module';
import { SetupModule } from './domains/setup/setup.module';
import { CatalogModule } from './domains/catalog/catalog.module';
import { SalesModule } from './domains/sales/sales.module';
import { LogisticsModule } from './domains/logistics/logistics.module';
import { ProcurementModule } from './domains/procurement/procurement.module';
import { FinanceModule } from './domains/finance/finance.module';
import { InvoicingModule } from './domains/invoicing/invoicing.module';
import { NotificationsModule } from './domains/notifications/notifications.module';
import { IntegrationsModule } from './domains/integrations/integrations.module';

import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './modules/audit/interceptors/audit.interceptor';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { LocationsModule } from './modules/locations/locations.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ShippingModule } from './domains/shipping/shipping.module';
import { BackupsModule } from './modules/backups/backups.module';

@Module({
  imports: [
    // 1. Configuración y Seguridad
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    RedisModule,
    OutboxModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Servir archivos estáticos (Ej: Logos de empresa)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // 4. Módulos de Funcionalidad
    IdentityModule,
    SetupModule,
    CatalogModule,
    SalesModule,
    LogisticsModule,
    ProcurementModule,
    FinanceModule,
    InvoicingModule,
    NotificationsModule,
    IntegrationsModule,
    AuditModule,
    HealthModule,
    SettingsModule,
    ReportsModule,
    LocationsModule,
    InventoryModule,
    // TransfersModule / TreasuryModule removed: duplicate routes handled by
    // domains/logistics (inventory/transfers) and domains/finance (treasury/shifts)
    // with PermissionsGuard. Legacy modules/* controllers kept for reference only.
    ShippingModule,
    BackupsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
