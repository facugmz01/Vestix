import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditContextService } from '../../core/audit-context/audit-context.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuditController } from './audit.controller';

@Global() // Global: every domain service can inject AuditService without re-importing
@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService, AuditInterceptor, AuditContextService],
  exports: [AuditService, AuditInterceptor, AuditContextService],
})
export class AuditModule {}
