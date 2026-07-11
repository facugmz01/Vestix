import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { CollectionsService } from '../services/collections.service';
import { CreateCollectionDto, UpdateCollectionDto } from '../dto/collection.dto';

@Controller('collections')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.collectionsService.findAll(activeOnly === 'true');
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectionsService.remove(id);
  }
}
