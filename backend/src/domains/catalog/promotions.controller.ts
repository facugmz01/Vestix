import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PromotionsService } from './services/promotions.service';
import { CreatePromotionDto, UpdatePromotionDto, BulkPromotionUpdateDto } from './dto/create-promotion.dto';

@Controller('promotions')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  getPromotions(@Query() query: Record<string, string>) {
    return this.promotionsService.findAll(query);
  }

  @Get('conflicts')
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  getConflicts() {
    return this.promotionsService.getConflicts();
  }

  @Get(':id/impact-preview')
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  getImpactPreview(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.getImpactPreview(id);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  getPromotion(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Pricing' })
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Post('bulk-update')
  @RequirePermissions({ action: 'update', subject: 'Pricing' })
  executeBulkUpdate(@Body() dto: BulkPromotionUpdateDto) {
    return this.promotionsService.executeBulkUpdate(dto);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Pricing' })
  updatePromotion(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Pricing' })
  deletePromotion(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.remove(id);
  }
}
