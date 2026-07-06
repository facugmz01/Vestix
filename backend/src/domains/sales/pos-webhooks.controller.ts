import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PosService } from './pos.service';

@Controller('pos/webhooks')
export class PosWebhooksController {
  constructor(private readonly posService: PosService) {}

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async mercadoPagoWebhook(@Body() body: Record<string, unknown>) {
    return this.posService.handleMercadoPagoWebhook(body);
  }
}
