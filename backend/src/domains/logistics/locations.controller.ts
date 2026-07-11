import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { LocationsService } from './locations.service';

@Controller('locations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getLocations(@Query() query: Record<string, string>) {
    return this.locationsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  createLocation(@Body() body: any) {
    return this.locationsService.create(body);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  updateLocation(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.locationsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  deleteLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.remove(id);
  }
}
