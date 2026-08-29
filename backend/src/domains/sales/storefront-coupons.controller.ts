import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Controller('storefront')
export class StorefrontCouponsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /storefront/validate-coupon
   * Validates a coupon code or gift card code.
   * Returns discount info or gift card balance.
   * Public endpoint — no auth required.
   */
  @Post('validate-coupon')
  @HttpCode(HttpStatus.OK)
  async validateCoupon(
    @Body() body: { code: string; cartTotal: number },
  ) {
    const code = (body.code || '').trim().toUpperCase();
    if (!code) return { valid: false, message: 'Código vacío.' };

    // 1. Check gift cards first
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { code, isActive: true },
    });
    if (giftCard) {
      if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
        return { valid: false, message: 'La Gift Card expiró.' };
      }
      if (giftCard.balance <= 0) {
        return { valid: false, message: 'La Gift Card no tiene saldo disponible.' };
      }
      return {
        valid: true,
        type: 'GIFT_CARD' as const,
        code,
        giftCardId: giftCard.id,
        balance: giftCard.balance,
        discountAmount: Math.min(giftCard.balance, body.cartTotal),
        message: `Gift Card con saldo disponible: ${giftCard.balance.toFixed(2)}`,
      };
    }

    // 2. Promotion/coupon lookup is not available yet (Promotion model pending)
    return { valid: false, message: 'Código no encontrado o inválido.' };
  }
}
