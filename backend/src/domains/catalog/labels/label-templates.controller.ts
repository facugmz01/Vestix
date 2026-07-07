import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { LabelTemplatesService } from './label-templates.service';
import {
  CreateLabelTemplateDto,
  UpdateLabelTemplateDto,
} from './dto/label-template.dto';

@Controller('labels/templates')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LabelTemplatesController {
  constructor(private readonly templatesService: LabelTemplatesService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Labels' })
  findAll() {
    return this.templatesService.findAll();
  }

  @Get('default')
  @RequirePermissions({ action: 'read', subject: 'Labels' })
  findDefault() {
    return this.templatesService.findDefault();
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Labels' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Labels' })
  create(@Body() dto: CreateLabelTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Labels' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLabelTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Labels' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.remove(id);
  }

  @Post(':id/duplicate')
  @RequirePermissions({ action: 'manage', subject: 'Labels' })
  duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.duplicate(id);
  }

  @Patch(':id/set-default')
  @RequirePermissions({ action: 'manage', subject: 'Labels' })
  setDefault(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.setDefault(id);
  }
}
