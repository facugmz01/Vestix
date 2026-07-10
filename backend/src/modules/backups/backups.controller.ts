import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { CurrentUser } from '../../core/rbac/decorators/current-user.decorator';
import { BackupsService } from './backups.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';

@Controller('backups')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Backups' })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.backupsService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Get(':id/download')
  @RequirePermissions({ action: 'read', subject: 'Backups' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { filePath, filename } = await this.backupsService.getDownloadPath(id);
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    createReadStream(filePath).pipe(res);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Backups' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.backupsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Backups' })
  create(
    @Body() dto: CreateBackupDto,
    @CurrentUser() user: { id?: string; userId?: string; email?: string },
  ) {
    return this.backupsService.create(
      dto,
      user?.id ?? user?.userId,
      user?.email,
    );
  }

  @Post(':id/restore')
  @RequirePermissions({ action: 'manage', subject: 'Backups' })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestoreBackupDto,
    @CurrentUser() user: { id?: string; userId?: string; email?: string },
  ) {
    if (!dto.confirm) {
      throw new BadRequestException(
        'Debe confirmar la restauración. Esta operación sobrescribirá los datos actuales.',
      );
    }
    return this.backupsService.restore(
      id,
      user?.id ?? user?.userId,
      user?.email,
    );
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Backups' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string; userId?: string; email?: string },
  ) {
    return this.backupsService.remove(
      id,
      user?.id ?? user?.userId,
      user?.email,
    );
  }
}
