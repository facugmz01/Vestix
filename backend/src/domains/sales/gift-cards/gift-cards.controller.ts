import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { GiftCardsService } from './gift-cards.service';
import { IssueGiftCardDto, RedeemGiftCardDto, UpdateGiftCardTemplateDto } from './dto/gift-card.dto';
import { resolveGiftCardTemplate } from '../models/gift-card-template.model';

@Controller('gift-cards')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  findAll(@Query('search') search?: string) {
    return this.giftCardsService.findAll(search);
  }

  @Get('template')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  getTemplate() {
    return this.giftCardsService.getTemplate();
  }

  @Patch('template')
  @RequirePermissions({ action: 'manage', subject: 'Sales' })
  updateTemplate(@Body() dto: UpdateGiftCardTemplateDto, @Req() req: any) {
    return this.giftCardsService.updateTemplate(
      resolveGiftCardTemplate(dto.template),
      req.user?.userId ?? 'unknown',
    );
  }

  @Post('issue')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  issue(@Body() dto: IssueGiftCardDto) {
    return this.giftCardsService.issue(dto);
  }

  @Get(':code/balance')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  getBalance(@Param('code') code: string) {
    return this.giftCardsService.getBalance(code);
  }

  @Post('redeem')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  redeem(@Body() dto: RedeemGiftCardDto) {
    return this.giftCardsService.redeem(dto);
  }

  @Post(':code/deactivate')
  @RequirePermissions({ action: 'manage', subject: 'Sales' })
  deactivate(@Param('code') code: string) {
    return this.giftCardsService.deactivate(code);
  }
}
