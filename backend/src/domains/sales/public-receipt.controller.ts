import { Controller, Get, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('receipt')
export class PublicReceiptController {
  constructor(private readonly salesService: SalesService) {}

  @Get(':orderId')
  getPublicReceipt(
    @Param('orderId') orderId: string,
    @Query('t') token: string,
  ) {
    return this.salesService.getPublicReceipt(orderId, token);
  }
}
