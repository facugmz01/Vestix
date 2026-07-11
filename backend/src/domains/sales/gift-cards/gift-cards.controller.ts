import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { GiftCardsService } from './gift-cards.service';
import { IssueGiftCardDto, RedeemGiftCardDto } from './dto/gift-card.dto';

@Controller('gift-cards')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  findAll(@Query('search') search?: string) {
    return this.giftCardsService.findAll(search);
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
