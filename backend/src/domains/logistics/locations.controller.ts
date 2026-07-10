import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('locations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LocationsController {
  private notImplemented() {
    throw new HttpException(
      'Ubicaciones de depósito no disponibles: el modelo Location aún no está en el esquema de base de datos.',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getLocations(
    @Query('page') _page: string,
    @Query('pageSize') _pageSize: string,
    @Query('search') _search?: string,
    @Query('warehouseId') _warehouseId?: string,
  ) {
    this.notImplemented();
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getLocation(@Param('id') _id: string) {
    this.notImplemented();
  }

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  createLocation(@Body() _body: any) {
    this.notImplemented();
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  updateLocation(@Param('id') _id: string, @Body() _body: any) {
    this.notImplemented();
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  deleteLocation(@Param('id') _id: string) {
    this.notImplemented();
  }
}
