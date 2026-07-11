import { Controller, Get, Query, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @RequirePermissions({ action: 'read', subject: 'System' })
  getLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.auditService.findAll({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      userId,
      module,
      action,
      entityType,
      search,
      dateFrom,
      dateTo,
    });
  }

  @Get('logs/:id')
  @RequirePermissions({ action: 'read', subject: 'System' })
  async getLog(@Param('id') id: string) {
    const log = await this.auditService.findById(id);
    if (!log) throw new NotFoundException('Registro de auditoría no encontrado');
    return log;
  }

  @Get('trace/:entityType/:entityId')
  @RequirePermissions({ action: 'read', subject: 'System' })
  getEntityTrace(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityTrace(entityType, entityId);
  }
}
