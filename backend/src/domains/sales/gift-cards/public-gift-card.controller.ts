import { Controller, Get, Param } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';

@Controller('gift-cards')
export class PublicGiftCardController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Get('verify/:token')
  verify(@Param('token') token: string) {
    return this.giftCardsService.verifyByToken(token);
  }
}
