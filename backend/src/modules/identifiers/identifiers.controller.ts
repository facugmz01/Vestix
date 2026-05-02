import { Controller, Post, Body } from '@nestjs/common';
import { IdentifiersService } from './identifiers.service';

@Controller('identifiers')
export class IdentifiersController {
  constructor(private readonly identifiersService: IdentifiersService) {}

  @Post('generate-sku')
  async generateSku(@Body() body: { productId?: string; attributes?: string[] }) {
    const sku = await this.identifiersService.generateVariantSku(
      body.productId || 'GENERIC',
      body.attributes || []
    );
    return { sku };
  }

  @Post('generate-barcode')
  async generateBarcode() {
    const barcode = await this.identifiersService.generateUniqueBarcode();
    return { barcode };
  }
}
