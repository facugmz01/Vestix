import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { PosService } from './pos.service';

@Controller('pos/webhooks')
export class PosWebhooksController {
  constructor(private readonly posService: PosService) {}

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async mercadoPagoWebhook(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.posService.handleMercadoPagoWebhook(
      body,
      req.headers as Record<string, string | string[] | undefined>,
    );
  }
}
