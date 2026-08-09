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

    // 2. Check promotions with coupon code
    const now = new Date();
    const promo = await this.prisma.promotion.findFirst({
      where: {
        couponCode: { equals: code, mode: 'insensitive' },
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
    });

    if (!promo) {
      return { valid: false, message: 'Código no encontrado o inválido.' };
    }

    // Check usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return { valid: false, message: 'El cupón ha alcanzado su límite de uso.' };
    }

    // Check minimum purchase
    if (promo.minPurchaseAmount && body.cartTotal < promo.minPurchaseAmount) {
      return {
        valid: false,
        message: `El cupón requiere una compra mínima de $${promo.minPurchaseAmount.toFixed(2)}.`,
      };
    }

    let discountAmount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = (body.cartTotal * (promo.discountValue || 0)) / 100;
      if (promo.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(promo.discountValue || 0, body.cartTotal);
    }

    return {
      valid: true,
      type: 'COUPON' as const,
      code,
      promotionId: promo.id,
      promotionName: promo.name,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: Math.round(discountAmount * 100) / 100,
      message: `Cupón aplicado: ${promo.name}`,
    };
  }
}
