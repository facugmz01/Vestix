import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IdentifiersService } from './identifiers.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('identifiers')
@UseGuards(AuthGuard('jwt'))
export class IdentifiersController {
  constructor(private readonly identifiersService: IdentifiersService) {}

  @Post('generate-sku')
  async generateSku(
    @Body() body: { productId?: string; attributes?: string[] | Record<string, string>; base?: boolean },
  ) {
    if (body.base || !body.productId) {
      const sku = await this.identifiersService.generateBaseSku();
      return { sku };
    }
    const sku = await this.identifiersService.generateVariantSku(
      body.productId,
      body.attributes || [],
    );
    return { sku };
  }

  @Post('generate-barcode')
  async generateBarcode() {
    const barcode = await this.identifiersService.generateUniqueBarcode();
    return { barcode };
  }
}
